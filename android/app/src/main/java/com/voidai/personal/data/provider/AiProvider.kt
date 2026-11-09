package com.voidai.personal.data.provider

import kotlinx.coroutines.flow.Flow

data class ChatMessage(
    val id: String = java.util.UUID.randomUUID().toString(),
    val role: Role,
    val content: String,
    val timestamp: Long = System.currentTimeMillis(),
    val isStreaming: Boolean = false
) {
    enum class Role {
        USER, ASSISTANT, SYSTEM
    }
}

enum class ConversationMode(val title: String, val promptDirective: String) {
    SHORT(
        "Short",
        "Be extremely concise, punchy, and direct. Limit responses to 1-4 lines. Speak natural Hinglish or the user's primary language. Do not output verbose preambles or greetings."
    ),
    NORMAL(
        "Normal",
        "Provide everyday conversational answers, helpful practical explanations, and balanced depth."
    ),
    DETAILED(
        "Detailed",
        "Provide thorough, deep technical explanations, complete working code blocks, security considerations, and architecture breakdowns."
    )
}

sealed class ProviderError(open val message: String) : Exception(message) {
    data class Authentication(override val message: String = "Invalid or expired API Key (401)") : ProviderError(message)
    data class PermissionDenied(override val message: String = "Access denied or permission forbidden (403)") : ProviderError(message)
    data class ModelNotFound(val model: String, override val message: String = "Model '$model' not found or retired (404)") : ProviderError(message)
    data class QuotaExceeded(override val message: String = "Rate limit or quota exceeded (429)") : ProviderError(message)
    data class BillingIssue(override val message: String = "Account billing issue or depleted credits") : ProviderError(message)
    data class NetworkFailure(val details: String, override val message: String = "Network connectivity failure: $details") : ProviderError(message)
    data class General(override val message: String) : ProviderError(message)
}

interface AiProvider {
    val id: String
    val displayName: String
    val defaultModel: String

    suspend fun fetchModels(apiKey: String, customBaseUrl: String? = null): Result<List<String>>

    fun streamChat(
        apiKey: String,
        model: String,
        temperature: Float,
        systemPrompt: String,
        history: List<ChatMessage>,
        customBaseUrl: String? = null
    ): Flow<String>
}
