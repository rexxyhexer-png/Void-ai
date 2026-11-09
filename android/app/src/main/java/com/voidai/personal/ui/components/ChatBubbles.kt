package com.voidai.personal.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.voidai.personal.data.provider.ChatMessage
import com.voidai.personal.ui.theme.VoidBorder
import com.voidai.personal.ui.theme.VoidSurface
import com.voidai.personal.ui.theme.VoidWhite

@Composable
fun ChatMessageItem(message: ChatMessage) {
    val isUser = message.role == ChatMessage.Role.USER

    Box(
        modifier = Modifier.fillMaxWidth(),
        contentAlignment = if (isUser) Alignment.CenterEnd else Alignment.CenterStart
    ) {
        if (isUser) {
            // User message: Content-sized bubble (a dot is a tiny bubble, never a full width card)
            Box(
                modifier = Modifier
                    .widthIn(max = 280.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(VoidWhite)
                    .padding(horizontal = 14.dp, vertical = 9.dp)
            ) {
                Text(
                    text = message.content,
                    color = Color.Black,
                    fontSize = 14.sp
                )
            }
        } else {
            // Assistant message
            Column(
                modifier = Modifier
                    .fillMaxWidth(0.92f)
                    .clip(RoundedCornerShape(16.dp))
                    .background(VoidSurface)
                    .border(1.dp, VoidBorder, RoundedCornerShape(16.dp))
                    .padding(horizontal = 16.dp, vertical = 12.dp)
            ) {
                if (message.content.isEmpty() && message.isStreaming) {
                    ProcessingDotsAnimation()
                } else {
                    Text(
                        text = message.content,
                        color = VoidWhite,
                        fontSize = 14.sp,
                        lineHeight = 20.sp
                    )
                }
            }
        }
    }
}

@Composable
fun ProcessingDotsAnimation() {
    val infiniteTransition = rememberInfiniteTransition()
    val alpha1 by infiniteTransition.animateFloat(
        initialValue = 0.2f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(600, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        )
    )
    val alpha2 by infiniteTransition.animateFloat(
        initialValue = 0.2f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(600, delayMillis = 200, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        )
    )
    val alpha3 by infiniteTransition.animateFloat(
        initialValue = 0.2f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(600, delayMillis = 400, easing = LinearEasing),
            repeatMode = RepeatMode.Reverse
        )
    )

    Row(
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.padding(vertical = 4.dp)
    ) {
        Box(
            modifier = Modifier
                .size(6.dp)
                .alpha(alpha1)
                .background(VoidWhite, RoundedCornerShape(3.dp))
        )
        Box(
            modifier = Modifier
                .size(6.dp)
                .alpha(alpha2)
                .background(VoidWhite, RoundedCornerShape(3.dp))
        )
        Box(
            modifier = Modifier
                .size(6.dp)
                .alpha(alpha3)
                .background(VoidWhite, RoundedCornerShape(3.dp))
        )
    }
}
