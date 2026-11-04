plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "com.example.ecal"
    compileSdk = 34

    signingConfigs {
        create("release") {
            storeFile = file("keystore/release.keystore")
            storePassword = "android"
            keyAlias = "ecal"
            keyPassword = "android"
            enableV1Signing = true
            enableV2Signing = true
        }
    }

    defaultConfig {
        applicationId = "com.example.ecal"
        minSdk = 24
        targetSdk = 34
        versionCode = 4
        versionName = "1.2.1"
        signingConfig = signingConfigs.getByName("release")
    }

    buildTypes {
        debug {
            signingConfig = signingConfigs.getByName("release")
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
