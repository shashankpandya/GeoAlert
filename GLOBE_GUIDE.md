# 🌍 Earth Pulse - 3D Globe Quick Guide

## Getting Started

### Accessing the Globe
1. Open your browser to `http://localhost:8080/EarthPulse.html`
2. Wait for the loading indicator (textures downloading from NASA CDN)
3. The globe will appear with real-time event markers

---

## 🎮 Controls

### Mouse Controls
| Action | Control |
|--------|---------|
| Rotate Globe | Click and drag |
| Zoom In/Out | Mouse wheel scroll |
| View Event Details | Click on any colored marker |
| Close Popup | Click on empty space or ✕ button |

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| **R** | Toggle auto-rotation on/off |
| **M** | Toggle event markers visibility |
| **H** | Reset camera to home view |
| **+** or **=** | Zoom in |
| **-** or **_** | Zoom out |
| **ESC** | Close event popup |

### Touch Controls (Mobile)
- **Single finger drag** - Rotate globe
- **Pinch** - Zoom in/out
- **Tap marker** - View event details

---

## 🎨 Visual Elements

### Event Markers
Markers on the globe represent natural events with color-coded severity:

| Color | Severity | Example |
|-------|----------|---------|
| 🔴 Red | **Critical** | M7+ earthquakes, Category 5 hurricanes |
| 🟠 Orange | **High** | M5-7 earthquakes, Category 3-4 storms |
| 🟡 Yellow | **Moderate** | M3-5 earthquakes, severe weather |
| 🔵 Blue | **Info** | Minor events, advisories |

### Marker Animations
- **Critical events** pulse rapidly with multiple expanding rings
- **High severity** shows moderate pulsing
- **Moderate/Info** have subtle breathing animations

### Atmosphere Layers
The globe features a realistic 4-layer atmosphere system:
1. **Inner haze** - Soft blue glow on the day side
2. **Limb glow** - Bright atmospheric rim
3. **Outer ring** - Subtle space effect
4. **Exosphere** - Faint boundary layer

---

## 🛠️ Control Panel

### Top Bar Statistics (Left Side)
- **🌍 Events** - Total active events on globe
- **🔴 Critical** - Number of critical severity events
- **🟠 High** - Number of high severity events
- **🤖 AI Active** - AI analysis engine status

### Control Buttons (Right Side)
Located in the top-right corner:

| Icon | Function | Default State |
|------|----------|---------------|
| 🔄 | Auto-rotation | ON (active) |
| ☁️ | Atmosphere visibility | ON |
| 📍 | Event markers | ON (active) |
| 🌙 | Day/night terminator | OFF |
| 🔍 | Reset camera view | Click to reset |

### Legend (Bottom Left)
Shows color coding for event severity levels with visual indicators.

### AI Briefing (Bottom Right)
Real-time AI-generated intelligence about current global events.

---

## 💡 Tips & Tricks

### Best Viewing Experience
1. **Auto-rotation**: Turn it ON (press **R**) to see all sides of Earth automatically
2. **Optimal zoom**: Use mouse wheel to zoom to ~2.5x for best detail
3. **Focus on region**: Click-drag to rotate to your area of interest
4. **Event details**: Click any pulsing marker for full information

### Performance Optimization
- **Reduce markers**: Press **M** if performance is slow
- **Disable atmosphere**: Click ☁️ button if you need maximum FPS
- **Lower texture quality**: The app automatically adjusts for your device

### Navigation
- **Lost orientation?** Press **H** to reset to home view
- **Too many markers?** Use the sidebar filters to show specific event types
- **Can't find an event?** Use the search box in the sidebar

---

## 🎯 Common Use Cases

### 1. Monitoring Global Earthquakes
- Look for 🔴 red markers (M7+) and 🟠 orange markers (M5-7)
- Critical events pulse more rapidly
- Click marker for magnitude, location, and tsunami risk

### 2. Tracking Weather Systems
- Hurricane markers appear with category-based severity
- Watch for marker clusters indicating storm tracks
- AI briefing provides pattern analysis

### 3. Analyzing Volcanic Activity
- Yellow/orange markers near tectonic boundaries
- Check AI panel for eruption correlation analysis
- Timeline view shows historical patterns

### 4. Emergency Response
- Click emergency button (🚨) in top bar for checklist
- Active alerts show in right sidebar
- Set alert zones in Alerts view

---

## 🔧 Troubleshooting

### Globe appears blue with no continents
- **Cause**: NASA textures failed to load
- **Solution**: Application automatically uses high-quality canvas fallback
- **Check**: Look in browser console (F12) for texture loading status

### Markers not appearing
- **Check**: Marker visibility (📍 button should be active/highlighted)
- **Check**: Sidebar filters - ensure event types are enabled
- **Solution**: Click the 📍 button or press **M** key

### Globe is too dark/bright
- **Adjustment**: Lighting is pre-calibrated for NASA textures
- **Workaround**: If using canvas fallback, lighting may appear different
- **Note**: This is expected behavior

### Rotation is choppy
- **Cause**: Device performance limitations
- **Solution 1**: Disable atmosphere (☁️ button)
- **Solution 2**: Reduce visible markers using filters
- **Solution 3**: Close other browser tabs

### Click not registering on markers
- **Cause**: Dragging motion detected
- **Solution**: Click and release without moving mouse
- **Note**: 3px threshold - stay very still when clicking

---

## 📱 Mobile Experience

### Optimizations for Mobile
- Touch controls automatically enabled
- Reduced marker count for performance
- Simplified atmosphere on lower-end devices
- Responsive layout adjusts for screen size

### Mobile-Specific Tips
- **Two-finger tap** - Quick zoom reset
- **Rotate device** - Best in landscape mode
- **Tap marker firmly** - Ensure single tap (not drag)

---

## 🌟 Advanced Features

### Texture System
The globe uses a fallback chain for maximum reliability:
1. **Primary**: NASA Blue Marble (2048×1024) from Three.js CDN
2. **Backup 1**: GitHub raw content
3. **Backup 2**: Unpkg CDN
4. **Final**: Procedural canvas with real continent coordinates

### Technical Specifications
- **Geometry**: 256×256 segments (65,536 vertices)
- **Textures**: Up to 2048×1024 resolution
- **Atmosphere**: 4 shader-based layers
- **Markers**: Up to 400 simultaneous
- **Lighting**: 5-point realistic setup
- **Rendering**: 60 FPS target with ACES tone mapping

---

## 🔄 Updates & Maintenance

### Auto-Updates
- Event data refreshes every 15-60 seconds
- AI briefings update every 2-5 minutes
- Marker animations run continuously

### Manual Refresh
- Press **F5** or **Ctrl+R** to reload entire application
- Use "Reset View" button to reset camera only
- Clear browser cache if experiencing texture issues

---

## 📞 Support

### Getting Help
- Check console (F12) for detailed error messages
- Review `IMPROVEMENTS.md` for technical details
- Verify server is running at `http://localhost:8080`

### Reporting Issues
Include in your report:
1. Browser and version
2. Device specifications
3. Console error messages (F12 → Console)
4. Screenshot of issue
5. Steps to reproduce

---

## 🎓 Learning Resources

### Understanding the Globe
- **Equirectangular projection** - How 2D textures wrap onto sphere
- **Spherical coordinates** - Lat/lon to 3D vector conversion
- **Phong material** - Realistic surface shading model
- **Raycasting** - Click detection in 3D space

### WebGL/Three.js
- Three.js official documentation
- WebGL fundamentals
- Shader programming basics
- 3D graphics optimization

---

## ✅ Quick Reference Card

```
┌─────────────────────────────────────────┐
│     EARTH PULSE - GLOBE CONTROLS        │
├─────────────────────────────────────────┤
│ ROTATE      Click + Drag / Touch Drag   │
│ ZOOM        Mouse Wheel / Pinch         │
│ AUTO-ROTATE Press R                     │
│ MARKERS     Press M                     │
│ RESET VIEW  Press H                     │
│ DETAILS     Click Marker                │
│ CLOSE       Press ESC / Click Empty     │
│ ZOOM IN     Press + or =                │
│ ZOOM OUT    Press - or _                │
├─────────────────────────────────────────┤
│ SEVERITY COLORS                         │
│ 🔴 Critical   🟠 High                   │
│ 🟡 Moderate   🔵 Info                   │
└─────────────────────────────────────────┘
```

---

*Enjoy exploring Earth Pulse! 🌍✨*

**Version**: 4.0  
**Last Updated**: 2026-07-03  
**URL**: http://localhost:8080/EarthPulse.html
