package com.voidai.personal

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.core.content.ContextCompat
import com.voidai.personal.ui.VoidAiScreen
import com.voidai.personal.ui.theme.VoidAITheme
import com.voidai.personal.viewmodel.VoidAiViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: VoidAiViewModel by viewModels()

    private val requestRecordAudioPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            if (isGranted) {
                viewModel.startVoiceDictation()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            VoidAITheme {
                VoidAiScreen(
                    viewModel = viewModel,
                    onRequestMicPermission = {
                        if (ContextCompat.checkSelfPermission(
                                this,
                                Manifest.permission.RECORD_AUDIO
                            ) == PackageManager.PERMISSION_GRANTED
                        ) {
                            viewModel.startVoiceDictation()
                        } else {
                            requestRecordAudioPermission.launch(Manifest.permission.RECORD_AUDIO)
                        }
                    }
                )
            }
        }
    }

    override fun onPause() {
        super.onPause()
        // Stop audio recognition when leaving foreground session
        viewModel.stopVoiceDictation()
    }
}
