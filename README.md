# Close or Keep

A Chrome extension that helps you declutter your browser tabs through a simple, card-based interface. Decide which tabs to keep and which to close with ease.

## Features

- **Card-based Interface**: View tabs one at a time with their favicon, title, and URL
- **Simple Actions**: Keep or close tabs with a single click or keyboard shortcut
- **Smart Ordering**: Shows most recently accessed tabs first, with active tab prioritized on fresh sessions
- **Keyboard Shortcuts**: 
  - `R` - Remove/close the current tab
  - `K` - Keep the current tab
- **Click to Navigate**: Click on any tab card to switch to that tab
- **Auto-continuation**: After closing a tab, automatically shows the next tab to review
- **Session Persistence**: Remembers which tabs you've already processed during a session

## Installation

### From Chrome Web Store
*Coming soon - extension will be available on the Chrome Web Store*

### Manual Installation (Development)
1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension directory
5. The extension icon will appear in your Chrome toolbar

## Usage

1. Click the "Close or Keep" extension icon in your Chrome toolbar
2. Review the tab shown in the card interface
3. Choose your action:
   - **Keep**: Click the keep button or press `K` to preserve the tab
   - **Remove**: Click the close button or press `R` to close the tab
4. Continue until all tabs have been reviewed
5. When finished, you'll see a completion message with an option to close the extension

## How It Works

- Only processes HTTP and HTTPS tabs (skips Chrome internal pages)
- Maintains a session-based list of processed tabs
- Automatically reopens after closing a tab to continue the review process
- Resets the processed list when opened fresh (not auto-reopened)

## Privacy

This extension:
- Only accesses tabs in your current browser window
- Does not collect or transmit any personal data
- Does not track your browsing history
- Operates entirely locally on your device

## Development

### Project Structure
```
tab-swiper/
├── manifest.json
├── src/
│   ├── main/
│   │   ├── index.html
│   │   ├── main.js
│   │   └── style.css
│   └── background/
│       └── service-worker.js
└── assets/
    └── icons/
        ├── close.svg
        ├── keep.svg
        ├── keyboard.svg
        └── share.svg
```

### Building
No build process required - this is a vanilla JavaScript extension.

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your chosen license here]

## Support

If you encounter any issues or have suggestions for improvements, please open an issue on the project repository.
