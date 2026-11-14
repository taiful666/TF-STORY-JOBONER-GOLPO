package com.taiful.tfstory

import android.os.CancellationSignal
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CredentialManagerCallback
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.ClearCredentialException
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import org.json.JSONObject

/**
 * "Sign in with Google" for the app. Google does not allow its sign-in page inside a WebView,
 * so the phone's own Google account picker (Credential Manager) is used instead.
 * It returns a Google ID token that the web page hands to Firebase (signInWithCredential).
 * The token is only passed to our own page inside the APK, never stored here.
 */
object GoogleSignIn {
    fun signIn(activity: MainActivity, done: (String) -> Unit) {
        val option = GetSignInWithGoogleOption.Builder(BuildConfig.GOOGLE_WEB_CLIENT_ID).build()
        val request = GetCredentialRequest.Builder().addCredentialOption(option).build()
        CredentialManager.create(activity).getCredentialAsync(
            activity, request, CancellationSignal(), ContextCompat.getMainExecutor(activity),
            object : CredentialManagerCallback<GetCredentialResponse, GetCredentialException> {
                override fun onResult(result: GetCredentialResponse) {
                    val c = result.credential
                    if (c is CustomCredential && c.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                        try { done(json("ok", GoogleIdTokenCredential.createFrom(c.data).idToken)) }
                        catch (e: Exception) { done(json("err", "bad-credential")) }
                    } else done(json("err", "unexpected-credential"))
                }

                override fun onError(e: GetCredentialException) {
                    Log.w("TFAuth", "sign-in failed: ${e.type} ${e.message}")
                    done(when (e) {
                        is GetCredentialCancellationException -> json("cancel", "")
                        is NoCredentialException -> json("err", "no-account")
                        else -> json("err", "${e.type}: ${e.message ?: ""}")
                    })
                }
            })
    }

    fun signOut(activity: MainActivity) {
        CredentialManager.create(activity).clearCredentialStateAsync(
            ClearCredentialStateRequest(), CancellationSignal(), ContextCompat.getMainExecutor(activity),
            object : CredentialManagerCallback<Void?, ClearCredentialException> {
                override fun onResult(result: Void?) {}
                override fun onError(e: ClearCredentialException) { Log.w("TFAuth", "sign-out: ${e.message}") }
            })
    }

    private fun json(status: String, value: String) = JSONObject().put("status", status).put("value", value).toString()
}
