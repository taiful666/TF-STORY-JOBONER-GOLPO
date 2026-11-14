import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// version comes from the GitHub Actions build number → every build is a newer update
val runNumber = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()
val appVersionName = (System.getenv("TF_VERSION_NAME") ?: "3.3") + "." + runNumber

android {
    namespace = "com.taiful.tfstory"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.taiful.tfstory"
        minSdk = 24
        targetSdk = 35
        versionCode = runNumber
        versionName = appVersionName
        buildConfigField("String", "UPDATE_REPO", "\"taiful666/TF-STORY-JOBONER-GOLPO\"")
        // Google sign-in: the Firebase project's Web client ID (public value, not a secret)
        buildConfigField("String", "GOOGLE_WEB_CLIENT_ID", "\"91248581816-edb3ndrh35pj40to6m0ia2nh4c67uvbq.apps.googleusercontent.com\"")
    }

    // Signing key is NEVER stored in the repo. GitHub Actions writes it from encrypted secrets.
    val ksFile = System.getenv("TF_KEYSTORE_FILE")
    signingConfigs {
        if (ksFile != null && file(ksFile).exists()) {
            create("release") {
                storeFile = file(ksFile)
                storePassword = System.getenv("TF_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("TF_KEY_ALIAS") ?: "tfstory"
                keyPassword = System.getenv("TF_KEY_PASSWORD") ?: System.getenv("TF_KEYSTORE_PASSWORD")
                enableV1Signing = true
                enableV2Signing = true
                enableV3Signing = true
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.findByName("release") ?: signingConfigs.getByName("debug")
        }
    }
    buildFeatures { buildConfig = true }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    androidResources { noCompress += listOf("html", "woff2") }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.activity:activity-ktx:1.9.2")
    implementation("androidx.webkit:webkit:1.11.0")
    implementation("androidx.work:work-runtime-ktx:2.9.1")
    // Sign in with Google (phone account picker) for the cloud sync of stories
    implementation("androidx.credentials:credentials:1.3.0")
    implementation("androidx.credentials:credentials-play-services-auth:1.3.0")
    implementation("com.google.android.libraries.identity.googleid:googleid:1.1.1")
}
