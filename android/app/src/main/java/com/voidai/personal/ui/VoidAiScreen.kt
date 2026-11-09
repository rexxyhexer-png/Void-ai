package com.voidai.personal.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.voidai.personal.data.provider.ConversationMode
import com.voidai.personal.ui.components.ActionConfirmationModal
import com.voidai.personal.ui.components.AngularCutoutComposer
import com.voidai.personal.ui.components.ChatMessageItem
import com.voidai.personal.ui.components.SettingsModalSheet
import com.voidai.personal.ui.theme.VoidBorder
import com.voidai.personal.ui.theme.VoidMuted
import com.voidai.personal.ui.theme.VoidSurface
import com.voidai.personal.ui.theme.VoidWhite
import com.voidai.personal.viewmodel.VoidAiViewModel
import com.voidai.personal.voice.VoiceState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VoidAiScreen(
    viewModel: VoidAiViewModel,
    onRequestMicPermission: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val listState = rememberLazyListState()

    // Auto-scroll on new message
    LaunchedEffect(uiState.messages.size, uiState.messages.lastOrNull()?.content) {
        if (uiState.messages.isNotEmpty()) {
            listState.animateScrollToItem(uiState.messages.size - 1)
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF050505))
            .systemBarsPadding()
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Circular Top Controls Bar
            TopControlsBar(
                currentMode = uiState.mode,
                voiceState = uiState.voiceState,
                onModeChange = { viewModel.setConversationMode(it) },
                onOpenSettings = { viewModel.toggleSettings(true) },
                onClearChat = { viewModel.clearChat() },
                onMicClick = onRequestMicPermission
            )

            // Chat Messages or Empty Branding View
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) {
                if (uiState.messages.isEmpty()) {
                    EmptyBrandHero(
                        selectedProvider = uiState.currentProviderId,
                        modelName = uiState.selectedModel,
                        hasKey = uiState.hasRememberedKey,
                        onOpenSettings = { viewModel.toggleSettings(true) }
                    )
                } else {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                        contentPadding = PaddingValues(top = 16.dp, bottom = 16.dp)
                    ) {
                        items(uiState.messages, key = { it.id }) { msg ->
                            ChatMessageItem(message = msg)
                        }
                    }
                }

                // Error notification overlay
                uiState.errorNotification?.let { error ->
                    Surface(
                        color = Color(0xFF221111),
                        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF552222)),
                        modifier = Modifier
                            .align(Alignment.TopCenter)
                            .padding(16.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = error,
                                color = Color(0xFFFF9999),
                                fontSize = 13.sp,
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }
                }
            }

            // Compact Angular Black Message Composer with White Cutout Border
            AngularCutoutComposer(
                input = uiState.currentInput,
                isStreaming = uiState.isStreaming,
                voiceState = uiState.voiceState,
                onInputChange = { viewModel.onInputChange(it) },
                onSend = { viewModel.sendMessage() },
                onCancel = { viewModel.cancelStreaming() },
                onMicClick = onRequestMicPermission
            )
        }

        // Action Confirmation Dialog
        uiState.pendingAction?.let { req ->
            ActionConfirmationModal(
                request = req,
                onConfirm = { viewModel.confirmPendingAction() },
                onDismiss = { viewModel.dismissPendingAction() }
            )
        }

        // Settings Bottom Sheet
        if (uiState.isSettingsOpen) {
            SettingsModalSheet(
                uiState = uiState,
                onDismiss = { viewModel.toggleSettings(false) },
                onProviderSelect = { viewModel.selectProvider(it) },
                onModelSelect = { viewModel.setCustomModel(it) },
                onTemperatureChange = { viewModel.setTemperature(it) },
                onSaveApiKey = { key, remember -> viewModel.setApiKey(key, remember) },
                onForgetCurrentKey = { viewModel.forgetCurrentProviderKey() },
                onForgetAllKeys = { viewModel.forgetAllKeys() },
                onRefreshModels = { viewModel.refreshModelCatalog() }
            )
        }
    }
}

@Composable
fun TopControlsBar(
    currentMode: ConversationMode,
    voiceState: VoiceState,
    onModeChange: (ConversationMode) -> Unit,
    onOpenSettings: () -> Unit,
    onClearChat: () -> Unit,
    onMicClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Strong Italic VOID AI Branding
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "VOID AI",
                color = VoidWhite,
                fontSize = 20.sp,
                fontWeight = FontWeight.Black,
                fontStyle = FontStyle.Italic,
                letterSpacing = (-0.5).sp
            )
        }

        // Circular Top Controls
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Mode Selector Pill Button
            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(VoidSurface)
                    .border(1.dp, VoidBorder, CircleShape)
                    .clickable {
                        val next = when (currentMode) {
                            ConversationMode.SHORT -> ConversationMode.NORMAL
                            ConversationMode.NORMAL -> ConversationMode.DETAILED
                            ConversationMode.DETAILED -> ConversationMode.SHORT
                        }
                        onModeChange(next)
                    }
                    .padding(horizontal = 12.dp, vertical = 6.dp)
            ) {
                Text(
                    text = currentMode.title.uppercase(),
                    color = VoidWhite,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
            }

            // Mic / Voice Control
            val isListening = voiceState is VoiceState.Listening
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(CircleShape)
                    .background(if (isListening) VoidWhite else VoidSurface)
                    .border(1.dp, if (isListening) VoidWhite else VoidBorder, CircleShape)
                    .clickable { onMicClick() },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Mic,
                    contentDescription = "Voice Input",
                    tint = if (isListening) Color.Black else VoidWhite,
                    modifier = Modifier.size(18.dp)
                )
            }

            // Clear Chat
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(CircleShape)
                    .background(VoidSurface)
                    .border(1.dp, VoidBorder, CircleShape)
                    .clickable { onClearChat() },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.DeleteOutline,
                    contentDescription = "Clear Chat",
                    tint = VoidMuted,
                    modifier = Modifier.size(18.dp)
                )
            }

            // Settings
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(CircleShape)
                    .background(VoidSurface)
                    .border(1.dp, VoidBorder, CircleShape)
                    .clickable { onOpenSettings() },
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Settings,
                    contentDescription = "Settings",
                    tint = VoidWhite,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}

@Composable
fun EmptyBrandHero(
    selectedProvider: String,
    modelName: String,
    hasKey: Boolean,
    onOpenSettings: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "VOID AI",
            color = VoidWhite,
            fontSize = 44.sp,
            fontWeight = FontWeight.Black,
            fontStyle = FontStyle.Italic,
            letterSpacing = (-1.5).sp
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "PERSONAL BYOK INTELLIGENCE",
            color = VoidMuted,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 2.sp
        )

        Spacer(modifier = Modifier.height(24.dp))

        Surface(
            color = VoidSurface,
            shape = CircleShape,
            border = androidx.compose.foundation.BorderStroke(1.dp, VoidBorder),
            modifier = Modifier.clickable { onOpenSettings() }
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "${selectedProvider.uppercase()} · $modelName",
                    color = VoidWhite,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
                if (!hasKey) {
                    Text(
                        text = "(Key Required)",
                        color = Color(0xFFFF9999),
                        fontSize = 11.sp
                    )
                }
            }
        }
    }
}
