package com.wattly.app;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Edge-to-edge: uygulama sistem çubuklarının arkasına kadar uzanır
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}
