package com.voidai.personal.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val VoidBlack = Color(0xFF050505)
val VoidSurface = Color(0xFF111111)
val VoidBorder = Color(0xFF2C2C2C)
val VoidWhite = Color(0xFFF7F7F7)
val VoidMuted = Color(0xFF8E8E93)
val VoidAccent = Color(0xFFFFFFFF)

private val MonochromeDarkScheme = darkColorScheme(
    primary = VoidAccent,
    onPrimary = VoidBlack,
    secondary = VoidMuted,
    onSecondary = VoidWhite,
    background = VoidBlack,
    onBackground = VoidWhite,
    surface = VoidSurface,
    onSurface = VoidWhite,
    surfaceVariant = VoidBorder,
    outline = VoidBorder
)

@Composable
fun VoidAITheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = MonochromeDarkScheme,
        content = content
    )
}
