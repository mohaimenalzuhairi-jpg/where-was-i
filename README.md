# Where Was I?

Pause a research task with a passage, the source tabs you choose, and a short note about what to do next. Resume with the evidence and the reminder together.

**[Try the interactive demo](https://mohaimenalzuhairi-jpg.github.io/where-was-i/)** · **[Browse the Chrome extension source](./extension/)**

## Try it in a minute

1. Open the demo. Select a passage in the sample article, or choose **Use a sample passage**.
2. Write a next step or choose **Use a sample note**. Select **Pause workspace**.
3. Refresh the page, then select **Resume workspace**. Your sample tabs, highlighted passage, and reminder return.

The demo uses three built-in sources. It runs on desktop or mobile without installation, and its saved state stays in that browser.

## Use it with your own tabs

1. From the repository's **Code** menu, select **Download ZIP**, then extract the archive.
2. In desktop Chrome 116 or later, open `chrome://extensions`, enable **Developer mode**, select **Load unpacked**, and choose the extracted **extension** folder that contains `manifest.json`.
3. Highlight text on an ordinary webpage and open **Where Was I?** from the extensions menu. Enter your next step. Use **Choose related tabs** if you want more sources saved with it, then select **Save checkpoint**.
4. Open the extension again and select **Resume work**. The extension opens the source and displays your note. Chrome can highlight the saved passage when it can still match the text on the page. The side panel also keeps a copy of the passage.

There is one saved checkpoint at a time. The extension stores it locally in Chrome. The extra tab-list permission is requested when you choose related tabs. Browser-internal pages and other restricted pages cannot be captured.

Built with HTML, CSS, JavaScript, and the Chrome Manifest V3 extension APIs.

## Team contributions and AI use

We’re Mohaimen and Ayyub. For the productivity challenge, we focused on the moment you reopen a research tab and wonder, “What was I going to do next?” In our demo, we show how saving one passage and a short reminder helps you pick up where you left off.

We used ChatGPT for help with the Chrome extension code, the interactive demo, and the video captions. Mohaimen reviewed the walkthrough and asked for smoother cursor movement and captions that matched the narration.
