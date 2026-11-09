package com.voidai.personal.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.voidai.personal.actions.ActionConfirmationRequest
import com.voidai.personal.ui.theme.VoidBorder
import com.voidai.personal.ui.theme.VoidMuted
import com.voidai.personal.ui.theme.VoidSurface
import com.voidai.personal.ui.theme.VoidWhite

@Composable
fun ActionConfirmationModal(
    request: ActionConfirmationRequest,
    onConfirm: () -> Unit,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(VoidSurface, RoundedCornerShape(16.dp))
                .border(1.dp, VoidBorder, RoundedCornerShape(16.dp))
                .padding(20.dp)
        ) {
            Text(
                text = request.title,
                color = VoidWhite,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = request.description,
                color = VoidMuted,
                fontSize = 13.sp,
                lineHeight = 18.sp
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Exact target box
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFF080808), RoundedCornerShape(8.dp))
                    .border(1.dp, Color(0xFF222222), RoundedCornerShape(8.dp))
                    .padding(10.dp)
            ) {
                Text(
                    text = "TARGET",
                    color = VoidMuted,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.sp
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = request.target,
                    color = VoidWhite,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = onDismiss,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = VoidWhite
                    ),
                    border = androidx.compose.foundation.BorderStroke(1.dp, VoidBorder)
                ) {
                    Text("Cancel", fontSize = 13.sp)
                }

                Button(
                    onClick = onConfirm,
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = VoidWhite,
                        contentColor = Color.Black
                    )
                ) {
                    Text("Confirm", fontSize = 13.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
