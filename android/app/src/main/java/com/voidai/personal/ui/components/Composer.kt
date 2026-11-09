package com.voidai.personal.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.GenericShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Mic
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.voidai.personal.ui.theme.VoidBorder
import com.voidai.personal.ui.theme.VoidMuted
import com.voidai.personal.ui.theme.VoidWhite
import com.voidai.personal.voice.VoiceState

/**
 * Custom angular notch shape: chamfered corners for the Void AI signature composer.
 */
val AngularCutoutShape = GenericShape { size, _ ->
    val corner = 12f
    moveTo(0f, corner)
    lineTo(corner, 0f)
    lineTo(size.width - corner, 0f)
    lineTo(size.width, corner)
    lineTo(size.width, size.height - corner)
    lineTo(size.width - corner, size.height)
    lineTo(corner, size.height)
    lineTo(0f, size.height - corner)
    close()
}

@Composable
fun AngularCutoutComposer(
    input: String,
    isStreaming: Boolean,
    voiceState: VoiceState,
    onInputChange: (String) -> Unit,
    onSend: () -> Unit,
    onCancel: () -> Unit,
    onMicClick: () -> Unit
) {
    val isListening = voiceState is VoiceState.Listening

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp)
    ) {
        // Listening status indicator if active
        AnimatedVisibility(visible = isListening) {
            val partial = (voiceState as? VoiceState.Listening)?.partialText.orEmpty()
            Text(
                text = if (partial.isNotEmpty()) "Heard: \"$partial\"" else "Listening...",
                color = VoidMuted,
                fontSize = 11.sp,
                modifier = Modifier.padding(bottom = 6.dp)
            )
        }

        // Angular Cutout Box with White Border
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(AngularCutoutShape)
                .background(Color(0xFF0A0A0A))
                .border(1.dp, Color(0xFFE5E5E5), AngularCutoutShape)
                .padding(horizontal = 14.dp, vertical = 8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Text input field
                BasicTextField(
                    value = input,
                    onValueChange = onInputChange,
                    textStyle = TextStyle(
                        color = VoidWhite,
                        fontSize = 14.sp
                    ),
                    cursorBrush = SolidColor(VoidWhite),
                    modifier = Modifier
                        .weight(1f)
                        .padding(vertical = 6.dp),
                    decorationBox = { innerTextField ->
                        if (input.isEmpty()) {
                            Text(
                                text = "Ask VOID AI...",
                                color = VoidMuted,
                                fontSize = 14.sp
                            )
                        }
                        innerTextField()
                    }
                )

                Spacer(modifier = Modifier.width(8.dp))

                // Mic dictation icon
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .clickable { onMicClick() },
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Mic,
                        contentDescription = "Voice Dictate",
                        tint = if (isListening) VoidWhite else VoidMuted,
                        modifier = Modifier.size(18.dp)
                    )
                }

                Spacer(modifier = Modifier.width(4.dp))

                // Send or Stop button
                if (isStreaming) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(VoidWhite)
                            .clickable { onCancel() },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Stop,
                            contentDescription = "Stop Generation",
                            tint = Color.Black,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                } else {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .clip(CircleShape)
                            .background(if (input.isNotBlank()) VoidWhite else Color(0xFF222222))
                            .clickable(enabled = input.isNotBlank()) { onSend() },
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Send,
                            contentDescription = "Send",
                            tint = if (input.isNotBlank()) Color.Black else VoidMuted,
                            modifier = Modifier.size(16.dp)
                        )
                    }
                }
            }
        }
    }
}
