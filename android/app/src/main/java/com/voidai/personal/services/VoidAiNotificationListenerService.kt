package com.voidai.personal.services

import android.app.Notification
import android.app.PendingIntent
import android.app.RemoteInput
import android.content.Intent
import android.os.Bundle
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log

/**
 * VoidAiNotificationListenerService
 *
 * Implements Android's official NotificationListenerService to intercept incoming messages
 * from apps like WhatsApp (com.whatsapp) and Instagram (com.instagram.android) while you are asleep.
 *
 * It uses Android RemoteInput quick-reply actions to respond automatically without opening the app!
 *
 * NOTE: User must manually enable "Notification Access" in Android Settings -> Special App Access.
 */
class VoidAiNotificationListenerService : NotificationListenerService() {

    companion object {
        private const val TAG = "VoidNotificationAI"
        var isAutoReplyEnabled = false
        var autoReplyPrompt = "I am currently sleeping. VOID AI automated response: "
    }

    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        if (!isAutoReplyEnabled || sbn == null) return

        val packageName = sbn.packageName
        // Only target messaging apps like WhatsApp or Instagram
        if (packageName != "com.whatsapp" && packageName != "com.instagram.android") {
            return
        }

        val extras = sbn.notification.extras ?: return
        val title = extras.getString(Notification.EXTRA_TITLE) ?: return
        val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString() ?: return

        // Prevent replying to group summaries or our own replies
        if (title.isBlank() || text.isBlank() || text.contains("automated response")) return

        Log.d(TAG, "Intercepted message from $packageName ($title): $text")

        // Search for RemoteInput quick-reply action inside the notification
        val actions = sbn.notification.actions ?: return
        for (action in actions) {
            val remoteInputs = action.remoteInputs ?: continue
            for (remoteInput in remoteInputs) {
                // Generate automated reply
                val replyMessage = "$autoReplyPrompt Hey $title, I received '$text'. The owner is currently resting and will get back to you soon!"
                sendReply(action.actionIntent, remoteInput, replyMessage)
                Log.d(TAG, "Sent automated reply to $title: $replyMessage")
                return
            }
        }
    }

    private fun sendReply(pendingIntent: PendingIntent, remoteInput: RemoteInput, replyText: String) {
        val intent = Intent()
        val bundle = Bundle().apply {
            putCharSequence(remoteInput.resultKey, replyText)
        }
        RemoteInput.addResultsToIntent(arrayOf(remoteInput), intent, bundle)
        try {
            pendingIntent.send(this, 0, intent)
        } catch (e: PendingIntent.CanceledException) {
            Log.e(TAG, "Failed to send auto-reply", e)
        }
    }
}
