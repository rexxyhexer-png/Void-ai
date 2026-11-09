package com.voidai.personal.services

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.os.Build
import android.view.accessibility.AccessibilityEvent
import androidx.annotation.RequiresApi

/**
 * VoidAiAccessibilityService
 *
 * Provides OS-level automation for gesture execution (e.g. reel scrolling),
 * screen locking, and global action triggers.
 *
 * NOTE: Android OS strictly requires the user to manually enable this in:
 * Settings -> Accessibility -> Downloaded Apps -> VOID AI Automation.
 * An app cannot auto-grant this permission.
 */
class VoidAiAccessibilityService : AccessibilityService() {

    companion object {
        var instance: VoidAiAccessibilityService? = null
            private set
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Monitors active foreground app window if needed
    }

    override fun onInterrupt() {
        instance = null
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }

    /**
     * Simulates a swipe-up gesture (e.g. Instagram Reels or TikTok next video).
     */
    @RequiresApi(Build.VERSION_CODES.N)
    fun scrollReelNext(): Boolean {
        val displayMetrics = resources.displayMetrics
        val middleX = displayMetrics.widthPixels / 2f
        val startY = displayMetrics.heightPixels * 0.75f
        val endY = displayMetrics.heightPixels * 0.25f

        val path = Path().apply {
            moveTo(middleX, startY)
            lineTo(middleX, endY)
        }

        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0, 300))
            .build()

        return dispatchGesture(gesture, null, null)
    }

    /**
     * Locks the phone screen immediately (Android 9+).
     */
    fun lockScreen(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            performGlobalAction(GLOBAL_ACTION_LOCK_SCREEN)
        } else {
            false
        }
    }

    /**
     * Simulates pressing the Home button.
     */
    fun goHome(): Boolean {
        return performGlobalAction(GLOBAL_ACTION_HOME)
    }

    /**
     * Simulates pressing the Back button.
     */
    fun goBack(): Boolean {
        return performGlobalAction(GLOBAL_ACTION_BACK)
    }
}
