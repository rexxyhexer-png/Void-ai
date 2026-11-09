package com.voidai.personal.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.voidai.personal.actions.ActionConfirmationRequest
import com.voidai.personal.actions.AndroidActionDispatcher
import com.voidai.personal.actions.ScopedAction
import com.voidai.personal.data.provider.AiProvider
import com.voidai.personal.data.provider.ChatMessage
import com.voidai.personal.data.provider.ConversationMode
import com.voidai.personal.data.provider.GeminiProvider
import com.voidai.personal.data.provider.GroqProvider
import com.voidai.personal.data.provider.OpenAiProvider
import com.voidai.personal.data.provider.ProviderError
import com.voidai.personal.data.security.EncryptedKeyStoreManager
import com.voidai.personal.voice.AndroidVoiceManager
import com.voidai.personal.voice.VoiceState
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class VoidAiUiState(
    val messages: List<ChatMessage> = emptyList(),
    val currentProviderId: String = "groq",
    val selectedModel: String = "llama-3.3-70b-versatile",
    val availableModels: List<String> = listOf("llama-3.3-70b-versatile", "llama-3.1-8b-instant"),
    val isFetchingModels: Boolean = false,
    val temperature: Float = 0.7f,
    val mode: ConversationMode = ConversationMode.SHORT,
    val isStreaming: Boolean = false,
    val currentInput: String = "",
    val hasRememberedKey: Boolean = false,
    val pendingAction: ActionConfirmationRequest? = null,
    val voiceState: VoiceState = VoiceState.Idle,
    val errorNotification: String? = null,
    val isSettingsOpen: Boolean = false
)

class VoidAiViewModel(application: Application) : AndroidViewModel(application) {

    private val keystoreManager = EncryptedKeyStoreManager(application)
    private val actionDispatcher = AndroidActionDispatcher(application)

    private val providers: Map<String, AiProvider> = mapOf(
        "groq" to GroqProvider(),
        "gemini" to GeminiProvider(),
        "openai" to OpenAiProvider()
    )

    private var activeSessionKey: String = ""
    private var streamingJob: Job? = null

    private val _uiState = MutableStateFlow(VoidAiUiState())
    val uiState: StateFlow<VoidAiUiState> = _uiState.asStateFlow()

    private val voiceManager = AndroidVoiceManager(application) { transcribedText ->
        _uiState.update { it.copy(currentInput = transcribedText) }
    }

    init {
        // Collect voice state
        viewModelScope.launch {
            voiceManager.voiceState.collect { state ->
                _uiState.update { it.copy(voiceState = state) }
            }
        }
        checkRememberedKeyForCurrentProvider()
    }

    fun onInputChange(newText: String) {
        _uiState.update { it.copy(currentInput = newText) }
    }

    fun setConversationMode(mode: ConversationMode) {
        _uiState.update { it.copy(mode = mode) }
    }

    fun toggleSettings(open: Boolean) {
        if (open) {
            voiceManager.stopListening()
        }
        _uiState.update { it.copy(isSettingsOpen = open) }
    }

    fun selectProvider(providerId: String) {
        val provider = providers[providerId] ?: return
        _uiState.update {
            it.copy(
                currentProviderId = providerId,
                selectedModel = provider.defaultModel,
                availableModels = listOf(provider.defaultModel)
            )
        }
        checkRememberedKeyForCurrentProvider()
    }

    fun setCustomModel(model: String) {
        _uiState.update { it.copy(selectedModel = model) }
    }

    fun setTemperature(temp: Float) {
        _uiState.update { it.copy(temperature = temp.coerceIn(0f, 1.5f)) }
    }

    private fun checkRememberedKeyForCurrentProvider() {
        val currentId = _uiState.value.currentProviderId
        val savedKey = keystoreManager.getProviderKey(currentId)
        if (!savedKey.isNullOrBlank()) {
            activeSessionKey = savedKey
            _uiState.update { it.copy(hasRememberedKey = true) }
            refreshModelCatalog()
        } else {
            activeSessionKey = ""
            _uiState.update { it.copy(hasRememberedKey = false) }
        }
    }

    fun setApiKey(apiKey: String, rememberOnDevice: Boolean) {
        val currentId = _uiState.value.currentProviderId
        activeSessionKey = apiKey.trim()

        if (rememberOnDevice && activeSessionKey.isNotBlank()) {
            keystoreManager.saveProviderKey(currentId, activeSessionKey)
            _uiState.update { it.copy(hasRememberedKey = true) }
        } else {
            keystoreManager.removeProviderKey(currentId)
            _uiState.update { it.copy(hasRememberedKey = false) }
        }

        if (activeSessionKey.isNotBlank()) {
            refreshModelCatalog()
        }
    }

    fun forgetCurrentProviderKey() {
        val currentId = _uiState.value.currentProviderId
        keystoreManager.removeProviderKey(currentId)
        activeSessionKey = ""
        _uiState.update { it.copy(hasRememberedKey = false) }
    }

    fun forgetAllKeys() {
        keystoreManager.removeAllKeys()
        activeSessionKey = ""
        _uiState.update { it.copy(hasRememberedKey = false) }
    }

    fun refreshModelCatalog() {
        val provider = providers[_uiState.value.currentProviderId] ?: return
        if (activeSessionKey.isBlank()) return

        _uiState.update { it.copy(isFetchingModels = true, errorNotification = null) }
        viewModelScope.launch {
            val result = provider.fetchModels(activeSessionKey)
            result.fold(
                onSuccess = { models ->
                    _uiState.update {
                        it.copy(
                            isFetchingModels = false,
                            availableModels = models,
                            selectedModel = if (models.contains(it.selectedModel)) it.selectedModel else models.firstOrNull() ?: it.selectedModel
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isFetchingModels = false,
                            errorNotification = classifyErrorMessage(error)
                        )
                    }
                }
            )
        }
    }

    fun sendMessage() {
        val text = _uiState.value.currentInput.trim()
        if (text.isEmpty() || _uiState.value.isStreaming) return

        if (activeSessionKey.isBlank()) {
            _uiState.update { it.copy(errorNotification = "Please enter an API Key in Settings") }
            toggleSettings(true)
            return
        }

        // Check for client-side intent heuristics before sending
        detectAndProposeAction(text)

        val userMessage = ChatMessage(role = ChatMessage.Role.USER, content = text)
        val assistantMessage = ChatMessage(
            role = ChatMessage.Role.ASSISTANT,
            content = "",
            isStreaming = true
        )

        _uiState.update {
            it.copy(
                messages = it.messages + userMessage + assistantMessage,
                currentInput = "",
                isStreaming = true,
                errorNotification = null
            )
        }

        val provider = providers[_uiState.value.currentProviderId] ?: return
        val systemPrompt = "You are VOID AI, a precise native assistant. ${uiState.value.mode.promptDirective}"

        streamingJob = viewModelScope.launch {
            val historyWithoutAssistant = _uiState.value.messages.dropLast(1)
            var accumulated = ""

            provider.streamChat(
                apiKey = activeSessionKey,
                model = _uiState.value.selectedModel,
                temperature = _uiState.value.temperature,
                systemPrompt = systemPrompt,
                history = historyWithoutAssistant
            ).catch { error ->
                _uiState.update { state ->
                    val lastMsg = state.messages.lastOrNull()
                    val updatedMessages = if (lastMsg != null && lastMsg.isStreaming) {
                        state.messages.dropLast(1) + lastMsg.copy(
                            content = if (accumulated.isNotBlank()) accumulated else "Error: ${classifyErrorMessage(error)}",
                            isStreaming = false
                        )
                    } else state.messages

                    state.copy(
                        messages = updatedMessages,
                        isStreaming = false,
                        errorNotification = classifyErrorMessage(error)
                    )
                }
            }.collect { token ->
                accumulated += token
                _uiState.update { state ->
                    val lastMsg = state.messages.lastOrNull()
                    if (lastMsg != null && lastMsg.isStreaming) {
                        state.copy(
                            messages = state.messages.dropLast(1) + lastMsg.copy(content = accumulated)
                        )
                    } else state
                }
            }

            _uiState.update { state ->
                val lastMsg = state.messages.lastOrNull()
                val updatedMessages = if (lastMsg != null && lastMsg.isStreaming) {
                    state.messages.dropLast(1) + lastMsg.copy(isStreaming = false)
                } else state.messages
                state.copy(messages = updatedMessages, isStreaming = false)
            }
        }
    }

    fun cancelStreaming() {
        streamingJob?.cancel()
        streamingJob = null
        _uiState.update { state ->
            val lastMsg = state.messages.lastOrNull()
            val updatedMessages = if (lastMsg != null && lastMsg.isStreaming) {
                state.messages.dropLast(1) + lastMsg.copy(isStreaming = false)
            } else state.messages
            state.copy(messages = updatedMessages, isStreaming = false)
        }
    }

    private fun detectAndProposeAction(query: String) {
        val lower = query.lowercase()
        when {
            lower.contains("dial") || lower.contains("call ") -> {
                val digits = query.filter { it.isDigit() || it == '+' }
                if (digits.length >= 3) {
                    _uiState.update {
                        it.copy(
                            pendingAction = ActionConfirmationRequest(
                                action = ScopedAction.OpenDialer(digits),
                                title = "Open Phone Dialer",
                                description = "Open Android phone dialer with number pre-filled. VOID AI will not make a call.",
                                target = digits
                            )
                        )
                    }
                }
            }
            lower.contains("open maps") || lower.contains("location ") -> {
                val place = query.replace("open maps", "").replace("location", "").trim()
                if (place.isNotBlank()) {
                    _uiState.update {
                        it.copy(
                            pendingAction = ActionConfirmationRequest(
                                action = ScopedAction.OpenMap(place),
                                title = "Open Google Maps",
                                description = "Launch Android Maps application for destination.",
                                target = place
                            )
                        )
                    }
                }
            }
            lower.contains("flashlight") || lower.contains("torch") -> {
                val enable = !lower.contains("off")
                _uiState.update {
                    it.copy(
                        pendingAction = ActionConfirmationRequest(
                            action = ScopedAction.ToggleFlashlight(enable),
                            title = "Toggle Flashlight",
                            description = "Change device camera torch hardware state to ${if (enable) "ON" else "OFF"}.",
                            target = "Camera Torch"
                        )
                    )
                }
            }
        }
    }

    fun confirmPendingAction() {
        val pending = _uiState.value.pendingAction ?: return
        val result = actionDispatcher.executeAction(pending.action)
        result.fold(
            onSuccess = { msg ->
                _uiState.update { it.copy(pendingAction = null, errorNotification = null) }
            },
            onFailure = { err ->
                _uiState.update { it.copy(pendingAction = null, errorNotification = err.localizedMessage) }
            }
        )
    }

    fun dismissPendingAction() {
        _uiState.update { it.copy(pendingAction = null) }
    }

    fun startVoiceDictation() {
        voiceManager.startListening()
    }

    fun stopVoiceDictation() {
        voiceManager.stopListening()
    }

    fun clearChat() {
        cancelStreaming()
        _uiState.update { it.copy(messages = emptyList(), errorNotification = null) }
    }

    private fun classifyErrorMessage(throwable: Throwable): String {
        return when (throwable) {
            is ProviderError.Authentication -> "Authentication Failed (401): Check your API key in Settings."
            is ProviderError.PermissionDenied -> "Access Denied (403): Your key lacks permission for this model."
            is ProviderError.ModelNotFound -> "Model Unavailable (404): ${throwable.message}"
            is ProviderError.QuotaExceeded -> "Rate Limit Exceeded (429): Quota exhausted or rate limited."
            is ProviderError.BillingIssue -> "Billing Error: Verify provider billing status and payment credits."
            is ProviderError.NetworkFailure -> "Network Error: ${throwable.details}"
            else -> throwable.localizedMessage ?: "Provider request failed."
        }
    }

    override fun onCleared() {
        super.onCleared()
        voiceManager.release()
        cancelStreaming()
    }
}
