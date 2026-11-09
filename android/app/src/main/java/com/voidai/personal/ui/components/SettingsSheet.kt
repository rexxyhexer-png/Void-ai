package com.voidai.personal.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.voidai.personal.ui.theme.VoidBorder
import com.voidai.personal.ui.theme.VoidMuted
import com.voidai.personal.ui.theme.VoidSurface
import com.voidai.personal.ui.theme.VoidWhite
import com.voidai.personal.viewmodel.VoidAiUiState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsModalSheet(
    uiState: VoidAiUiState,
    onDismiss: () -> Unit,
    onProviderSelect: (String) -> Unit,
    onModelSelect: (String) -> Unit,
    onTemperatureChange: (Float) -> Unit,
    onSaveApiKey: (key: String, remember: Boolean) -> Unit,
    onForgetCurrentKey: () -> Unit,
    onForgetAllKeys: () -> Unit,
    onRefreshModels: () -> Unit
) {
    var inputKey by remember { mutableStateOf("") }
    var showPassword by remember { mutableStateOf(false) }
    var rememberOnDevice by remember { mutableStateOf(uiState.hasRememberedKey) }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = VoidSurface,
        dragHandle = {
            Box(
                modifier = Modifier
                    .padding(vertical = 10.dp)
                    .size(width = 32.dp, height = 4.dp)
                    .background(Color(0xFF333333), RoundedCornerShape(2.dp))
            )
        }
    ) {
        LazyColumn(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 8.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
            contentPadding = PaddingValues(bottom = 32.dp)
        ) {
            // Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "BYOK SETTINGS & SECURITY",
                        color = VoidWhite,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = VoidMuted)
                    }
                }
            }

            // Provider Switcher
            item {
                Text(
                    text = "SELECT PROVIDER",
                    color = VoidMuted,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    val providers = listOf(
                        "groq" to "Groq",
                        "gemini" to "Gemini",
                        "openai" to "OpenAI"
                    )
                    providers.forEach { (id, label) ->
                        val isSelected = uiState.currentProviderId == id
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .clip(RoundedCornerShape(8.dp))
                                .background(if (isSelected) VoidWhite else Color(0xFF161616))
                                .border(1.dp, if (isSelected) VoidWhite else VoidBorder, RoundedCornerShape(8.dp))
                                .clickable { onProviderSelect(id) }
                                .padding(vertical = 10.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = label,
                                color = if (isSelected) Color.Black else VoidWhite,
                                fontSize = 13.sp,
                                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium
                            )
                        }
                    }
                }
            }

            // API Key Entry
            item {
                Text(
                    text = "PERSONAL API KEY (${uiState.currentProviderId.uppercase()})",
                    color = VoidMuted,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(6.dp))

                OutlinedTextField(
                    value = inputKey,
                    onValueChange = { inputKey = it },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = {
                        Text(
                            text = if (uiState.hasRememberedKey) "•••••••• (Keystore encrypted key saved)" else "Paste personal API key",
                            color = VoidMuted,
                            fontSize = 13.sp
                        )
                    },
                    visualTransformation = if (showPassword) VisualTransformation.None else PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = VoidWhite,
                        unfocusedBorderColor = VoidBorder,
                        focusedTextColor = VoidWhite,
                        unfocusedTextColor = VoidWhite,
                        focusedContainerColor = Color(0xFF0A0A0A),
                        unfocusedContainerColor = Color(0xFF0A0A0A)
                    ),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Checkbox(
                            checked = rememberOnDevice,
                            onCheckedChange = { rememberOnDevice = it },
                            colors = CheckboxDefaults.colors(
                                checkedColor = VoidWhite,
                                checkmarkColor = Color.Black
                            )
                        )
                        Text(
                            text = "Remember key on this device (Keystore AES-GCM)",
                            color = VoidWhite,
                            fontSize = 12.sp
                        )
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = {
                            if (inputKey.isNotBlank()) {
                                onSaveApiKey(inputKey, rememberOnDevice)
                                inputKey = ""
                            }
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = VoidWhite,
                            contentColor = Color.Black
                        ),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Save & Connect", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }

                    if (uiState.hasRememberedKey) {
                        OutlinedButton(
                            onClick = onForgetCurrentKey,
                            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF552222)),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFFF8888))
                        ) {
                            Text("Forget", fontSize = 12.sp)
                        }
                    }
                }
            }

            // Model Selection
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "ACTIVE MODEL",
                        color = VoidMuted,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        letterSpacing = 1.sp
                    )
                    IconButton(
                        onClick = onRefreshModels,
                        modifier = Modifier.size(24.dp)
                    ) {
                        Icon(
                            Icons.Default.Refresh,
                            contentDescription = "Refresh Models",
                            tint = VoidMuted,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = uiState.selectedModel,
                    color = VoidWhite,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold
                )

                if (uiState.availableModels.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF080808), RoundedCornerShape(8.dp))
                            .border(1.dp, VoidBorder, RoundedCornerShape(8.dp))
                            .padding(8.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        uiState.availableModels.take(8).forEach { m ->
                            val isChosen = m == uiState.selectedModel
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(if (isChosen) Color(0xFF1E1E1E) else Color.Transparent)
                                    .clickable { onModelSelect(m) }
                                    .padding(horizontal = 8.dp, vertical = 6.dp)
                            ) {
                                Text(
                                    text = m,
                                    color = if (isChosen) VoidWhite else VoidMuted,
                                    fontSize = 12.sp
                                )
                            }
                        }
                    }
                }
            }

            // Temperature Slider
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "TEMPERATURE",
                        color = VoidMuted,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold,
                        letterSpacing = 1.sp
                    )
                    Text(
                        text = String.format("%.2f", uiState.temperature),
                        color = VoidWhite,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Slider(
                    value = uiState.temperature,
                    onValueChange = onTemperatureChange,
                    valueRange = 0.0f..1.5f,
                    colors = SliderDefaults.colors(
                        thumbColor = VoidWhite,
                        activeTrackColor = VoidWhite,
                        inactiveTrackColor = Color(0xFF222222)
                    )
                )
            }

            // Forget All Keys Wipe
            item {
                Divider(color = VoidBorder, modifier = Modifier.padding(vertical = 4.dp))
                TextButton(
                    onClick = onForgetAllKeys,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = "Wipe All Stored Keys From Keystore",
                        color = Color(0xFFFF6666),
                        fontSize = 12.sp
                    )
                }
            }
        }
    }
}
