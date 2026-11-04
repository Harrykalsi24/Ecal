import java.util.Properties
import java.io.FileInputStream

plugins {
    alias(libs.plugins.android.application)
}

val keystorePropertiesFile = rootProject.file("keystore.properties").takeIf { it.exists() }
    ?: project.file("keystore.properties").takeIf { it.exists() }
val keystoreProperties = Properties().apply {
    if (keystorePropertiesFile != null && keystorePropertiesFile.exists()) {
        load(FileInputStream(keystorePropertiesFile))
    }
}

val releaseStoreFilePath = System.getenv("KEYSTORE_FILE")
    ?: keystoreProperties.getProperty("storeFile")
    ?: "keystore/release.keystore"

val releaseStorePassword = System.getenv("KEYSTORE_PASSWORD")
    ?: keystoreProperties.getProperty("storePassword")
    ?: "android"

val releaseKeyAlias = System.getenv("KEY_ALIAS")
    ?: keystoreProperties.getProperty("keyAlias")
    ?: "ecal"

val releaseKeyPassword = System.getenv("KEY_PASSWORD")
    ?: keystoreProperties.getProperty("keyPassword")
    ?: "android"

android {
    namespace = "com.example.ecal"
    compileSdk = 34

    signingConfigs {
        create("release") {
            val keyFile = file(releaseStoreFilePath)
            if (keyFile.exists()) {
                storeFile = keyFile
                storePassword = releaseStorePassword
                keyAlias = releaseKeyAlias
                keyPassword = releaseKeyPassword
                enableV1Signing = true
                enableV2Signing = true
            }
        }
        create("debugConfig") {
            val debugFile = file("keystore/release.keystore")
            if (debugFile.exists()) {
                storeFile = debugFile
                storePassword = "android"
                keyAlias = "ecal"
                keyPassword = "android"
                enableV1Signing = true
                enableV2Signing = true
            }
        }
    }

    defaultConfig {
        applicationId = "com.example.ecal"
        minSdk = 24
        targetSdk = 34
        versionCode = 5
        versionName = "1.3.0"
        signingConfig = signingConfigs.getByName("release")
    }

    buildTypes {
        debug {
            signingConfig = signingConfigs.getByName("debugConfig")
            isDebuggable = true
        }
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }

    buildFeatures {
        compose = false
        aidl = false
        buildConfig = false
        shaders = false
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}
