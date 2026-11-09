package com.voidai.personal.actions

import android.content.Context
import android.content.Intent
import android.hardware.camera2.CameraAccessException
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.net.Uri
import android.provider.AlarmClock
import android.provider.MediaStore
import android.provider.Settings

sealed class ScopedAction {
    data class OpenBrowser(val url: String) : ScopedAction()
    data class OpenMap(val query: String) : ScopedAction()
    data class OpenDialer(val phoneNumber: String) : ScopedAction()
    data class SendSms(val phoneNumber: String, val message: String) : ScopedAction()
    data class SetAlarm(val hour: Int, val minutes: Int, val message: String) : ScopedAction()
    data class ShareText(val text: String, val title: String = "Share via VOID AI") : ScopedAction()
    data class ToggleFlashlight(val enable: Boolean) : ScopedAction()
    data class OpenApp(val appPackageOrTarget: String, val appName: String) : ScopedAction()
    data class OpenSystemSetting(val settingAction: String, val name: String) : ScopedAction()
    object OpenCamera : ScopedAction()
}

data class ActionConfirmationRequest(
    val action: ScopedAction,
    val title: String,
    val description: String,
    val target: String,
    val isDestructiveOrConsequential: Boolean = false
)

class AndroidActionDispatcher(private val context: Context) {

    private val activityLog = mutableListOf<String>()

    fun getLog(): List<String> = activityLog.toList()

    /**
     * Executes an approved action following explicit user confirmation.
     */
    fun executeAction(action: ScopedAction): Result<String> {
        return try {
            when (action) {
                is ScopedAction.ToggleFlashlight -> {
                    val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as? CameraManager
                        ?: return Result.failure(IllegalStateException("Camera hardware unavailable"))
                    val cameraId = cameraManager.cameraIdList.firstOrNull { id ->
                        val chars = cameraManager.getCameraCharacteristics(id)
                        chars.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) == true
                    } ?: return Result.failure(IllegalStateException("No camera with flash found"))

                    try {
                        cameraManager.setTorchMode(cameraId, action.enable)
                        logAction("Flashlight torch set to: ${action.enable}")
                        Result.success("Flashlight turned ${if (action.enable) "ON" else "OFF"}")
                    } catch (e: CameraAccessException) {
                        Result.failure(e)
                    }
                }

                is ScopedAction.OpenDialer -> {
                    // ACTION_DIAL pre-fills the dialer, NEVER places calls silently.
                    val dialUri = Uri.parse("tel:${action.phoneNumber.filter { it.isDigit() || it == '+' }}")
                    val intent = Intent(Intent.ACTION_DIAL, dialUri).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(intent)
                    logAction("Opened dialer for number: ${action.phoneNumber}")
                    Result.success("Dialer opened with ${action.phoneNumber}")
                }

                is ScopedAction.SendSms -> {
                    val smsUri = Uri.parse("smsto:${action.phoneNumber}")
                    val intent = Intent(Intent.ACTION_SENDTO, smsUri).apply {
                        putExtra("sms_body", action.message)
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(intent)
                    logAction("Opened SMS app to compose message for ${action.phoneNumber}")
                    Result.success("Opened SMS composer for ${action.phoneNumber}")
                }

                is ScopedAction.SetAlarm -> {
                    val intent = Intent(AlarmClock.ACTION_SET_ALARM).apply {
                        putExtra(AlarmClock.EXTRA_HOUR, action.hour)
                        putExtra(AlarmClock.EXTRA_MINUTES, action.minutes)
                        putExtra(AlarmClock.EXTRA_MESSAGE, action.message)
                        putExtra(AlarmClock.EXTRA_SKIP_UI, false) // Review in system UI
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(intent)
                    logAction("Alarm setup launched: ${action.hour}:${action.minutes} - ${action.message}")
                    Result.success("Alarm set for ${action.hour}:${action.minutes}")
                }

                is ScopedAction.OpenMap -> {
                    val geoUri = Uri.parse("geo:0,0?q=${Uri.encode(action.query)}")
                    val intent = Intent(Intent.ACTION_VIEW, geoUri).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(intent)
                    logAction("Opened Google Maps: ${action.query}")
                    Result.success("Maps navigation opened for ${action.query}")
                }

                is ScopedAction.OpenCamera -> {
                    val intent = Intent(MediaStore.INTENT_ACTION_STILL_IMAGE_CAMERA).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(intent)
                    logAction("Opened Camera app")
                    Result.success("Camera opened")
                }

                is ScopedAction.OpenApp -> {
                    val launchIntent = context.packageManager.getLaunchIntentForPackage(action.appPackageOrTarget)
                    if (launchIntent != null) {
                        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        context.startActivity(launchIntent)
                        logAction("Launched installed app: ${action.appName} (${action.appPackageOrTarget})")
                        Result.success("App opened: ${action.appName}")
                    } else {
                        // Fallback: Open Play Store for this app
                        val marketIntent = Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=${action.appPackageOrTarget}")).apply {
                            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        }
                        context.startActivity(marketIntent)
                        Result.success("App not found locally, opening Play Store")
                    }
                }

                is ScopedAction.OpenSystemSetting -> {
                    val intent = Intent(action.settingAction).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(intent)
                    logAction("Opened System Settings: ${action.name}")
                    Result.success("Opened ${action.name}")
                }

                is ScopedAction.OpenBrowser -> {
                    val sanitizedUrl = if (action.url.startsWith("http://") || action.url.startsWith("https://")) {
                        action.url
                    } else {
                        "https://${action.url}"
                    }
                    val intent = Intent(Intent.ACTION_VIEW, Uri.parse(sanitizedUrl)).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(intent)
                    logAction("Opened browser URL: $sanitizedUrl")
                    Result.success("Browser opened for $sanitizedUrl")
                }

                is ScopedAction.ShareText -> {
                    val intent = Intent(Intent.ACTION_SEND).apply {
                        type = "text/plain"
                        putExtra(Intent.EXTRA_TEXT, action.text)
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    val chooser = Intent.createChooser(intent, action.title).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(chooser)
                    logAction("Shared text to system share sheet")
                    Result.success("System share sheet launched")
                }
            }
        } catch (e: Exception) {
            logAction("Action execution failed: ${e.localizedMessage}")
            Result.failure(e)
        }
    }

    private fun logAction(msg: String) {
        val entry = "[${System.currentTimeMillis()}] $msg"
        activityLog.add(entry)
    }
}
