package com.voidai.personal.data.provider

import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import okhttp3.sse.EventSource
import okhttp3.sse.EventSourceListener
import okhttp3.sse.EventSources
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

class GroqProvider(
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()
) : AiProvider {

    override val id: String = "groq"
    override val displayName: String = "Groq BYOK"
    override val defaultModel: String = "llama-3.3-70b-versatile"

    private val baseUrl = "https://api.groq.com/openai/v1"

    override suspend fun fetchModels(apiKey: String, customBaseUrl: String?): Result<List<String>> {
        return try {
            val url = "${customBaseUrl ?: baseUrl}/models"
            val request = Request.Builder()
                .url(url)
                .header("Authorization", "Bearer $apiKey")
                .header("User-Agent", "VoidAI-Android/1.0")
                .get()
                .build()

            client.newCall(request).execute().use { response ->
                when (response.code) {
                    200 -> {
                        val body = response.body?.string().orEmpty()
                        val json = JSONObject(body)
                        val dataArray = json.optJSONArray("data") ?: JSONArray()
                        val list = mutableListOf<String>()
                        for (i in 0 until dataArray.length()) {
                            val modelObj = dataArray.getJSONObject(i)
                            val modelId = modelObj.optString("id")
                            // Filter audio, whisper, embeddings
                            if (!modelId.contains("whisper") &&
                                !modelId.contains("embed") &&
                                !modelId.contains("guard") &&
                                !modelId.contains("tts")
                            ) {
                                list.add(modelId)
                            }
                        }
                        if (list.isEmpty()) {
                            list.add(defaultModel)
                        }
                        Result.success(list.sorted())
                    }
                    401 -> Result.failure(ProviderError.Authentication())
                    403 -> Result.failure(ProviderError.PermissionDenied())
                    429 -> Result.failure(ProviderError.QuotaExceeded())
                    else -> Result.failure(ProviderError.General("Groq API error HTTP ${response.code}"))
                }
            }
        } catch (e: IOException) {
            Result.failure(ProviderError.NetworkFailure(e.localizedMessage ?: "Connection failed"))
        } catch (e: Exception) {
            Result.failure(ProviderError.General(e.localizedMessage ?: "Unknown error"))
        }
    }

    override fun streamChat(
        apiKey: String,
        model: String,
        temperature: Float,
        systemPrompt: String,
        history: List<ChatMessage>,
        customBaseUrl: String?
    ): Flow<String> = callbackFlow {
        val messagesArray = JSONArray()

        if (systemPrompt.isNotBlank()) {
            messagesArray.put(
                JSONObject().apply {
                    put("role", "system")
                    put("content", systemPrompt)
                }
            )
        }

        // Include up to last 40 history messages
        val trimmed = history.takeLast(40)
        for (msg in trimmed) {
            val roleStr = when (msg.role) {
                ChatMessage.Role.USER -> "user"
                ChatMessage.Role.ASSISTANT -> "assistant"
                ChatMessage.Role.SYSTEM -> "system"
            }
            messagesArray.put(
                JSONObject().apply {
                    put("role", roleStr)
                    put("content", msg.content)
                }
            )
        }

        val payload = JSONObject().apply {
            put("model", model.ifBlank { defaultModel })
            put("messages", messagesArray)
            put("temperature", temperature)
            put("stream", true)
        }

        val request = Request.Builder()
            .url("${customBaseUrl ?: baseUrl}/chat/completions")
            .header("Authorization", "Bearer $apiKey")
            .header("Content-Type", "application/json")
            .header("User-Agent", "VoidAI-Android/1.0")
            .post(payload.toString().toRequestBody("application/json".toMediaType()))
            .build()

        val sseFactory = EventSources.createFactory(client)
        val eventSource = sseFactory.newEventSource(
            request,
            object : EventSourceListener() {
                override fun onEvent(eventSource: EventSource, id: String?, type: String?, data: String) {
                    if (data == "[DONE]") {
                        close()
                        return
                    }
                    try {
                        val json = JSONObject(data)
                        val choices = json.optJSONArray("choices")
                        if (choices != null && choices.length() > 0) {
                            val delta = choices.getJSONObject(0).optJSONObject("delta")
                            val content = delta?.optString("content").orEmpty()
                            if (content.isNotEmpty()) {
                                trySend(content)
                            }
                        }
                    } catch (_: Exception) {
                        // ignore malformed SSE line
                    }
                }

                override fun onFailure(eventSource: EventSource, t: Throwable?, response: Response?) {
                    val code = response?.code
                    val error = when (code) {
                        401 -> ProviderError.Authentication()
                        403 -> ProviderError.PermissionDenied()
                        404 -> ProviderError.ModelNotFound(model)
                        429 -> ProviderError.QuotaExceeded()
                        else -> ProviderError.NetworkFailure(t?.localizedMessage ?: "Stream ended abruptly")
                    }
                    close(error)
                }

                override fun onClosed(eventSource: EventSource) {
                    close()
                }
            }
        )

        awaitClose {
            eventSource.cancel()
        }
    }
}
