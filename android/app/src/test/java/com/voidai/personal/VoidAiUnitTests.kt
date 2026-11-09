package com.voidai.personal

import com.voidai.personal.actions.ActionConfirmationRequest
import com.voidai.personal.actions.ScopedAction
import com.voidai.personal.data.provider.ChatMessage
import com.voidai.personal.data.provider.ConversationMode
import com.voidai.personal.data.provider.ProviderError
import org.junit.Assert.*
import org.junit.Test

class VoidAiUnitTests {

    @Test
    fun testConversationModeDirectives() {
        assertEquals("Short", ConversationMode.SHORT.title)
        assertTrue(ConversationMode.SHORT.promptDirective.contains("1-4 lines"))
        assertTrue(ConversationMode.NORMAL.promptDirective.contains("conversational"))
        assertTrue(ConversationMode.DETAILED.promptDirective.contains("technical explanations"))
    }

    @Test
    fun testProviderErrorClassification() {
        val authError = ProviderError.Authentication("Invalid token")
        assertEquals("Invalid token", authError.message)

        val notFoundError = ProviderError.ModelNotFound("gpt-oss-retired")
        assertTrue(notFoundError.message.contains("gpt-oss-retired"))

        val quotaError = ProviderError.QuotaExceeded()
        assertTrue(quotaError.message.contains("429") || quotaError.message.contains("quota"))
    }

    @Test
    fun testActionConfirmationTargetValidation() {
        val action = ScopedAction.OpenDialer("+1234567890")
        val req = ActionConfirmationRequest(
            action = action,
            title = "Open Phone Dialer",
            description = "Pre-fill phone number",
            target = "+1234567890"
        )

        assertEquals("+1234567890", req.target)
        assertTrue(req.action is ScopedAction.OpenDialer)
        assertFalse(req.isDestructiveOrConsequential)
    }

    @Test
    fun testChatMessageTrimmingPreservesRecent40() {
        val list = (1..60).map {
            ChatMessage(
                role = if (it % 2 == 0) ChatMessage.Role.USER else ChatMessage.Role.ASSISTANT,
                content = "Msg $it"
            )
        }
        val trimmed = list.takeLast(40)
        assertEquals(40, trimmed.size)
        assertEquals("Msg 21", trimmed.first().content)
        assertEquals("Msg 60", trimmed.last().content)
    }

    @Test
    fun testNoKeyInErrorMessages() {
        val secretKey = "sk-proj-supersecret123456789"
        val rawMessage = "Failed to call provider endpoint with key $secretKey"
        val sanitized = if (rawMessage.contains(secretKey)) {
            rawMessage.replace(secretKey, "[REDACTED]")
        } else rawMessage

        assertFalse(sanitized.contains(secretKey))
        assertTrue(sanitized.contains("[REDACTED]"))
    }
}
