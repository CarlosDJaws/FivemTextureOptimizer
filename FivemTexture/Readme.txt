How to Use the FiveM Texture Optimizer Assistant
This is a simple tool to help you check your custom textures before you put them on your FiveM server. Using unoptimized textures is a common cause of lag, stuttering, and FPS drops for players. This tool helps you catch the biggest problems early.

What you need to do:

Set Up the Folder: Create a main folder and put the index.html, css folder, and js folder inside it, exactly like the structure shows.

Open the Tool: Double-click the index.html file. It will open in your web browser. You don't need to install anything.

Check Your Textures:

Drag and drop your texture files (like .png or .jpg) onto the page.

The tool will instantly check them. It looks for one main thing: Are the dimensions a "power of two"? (e.g., 512x512, 1024x1024, 2048x2048). This is a critical requirement for game engines.

You will see a green checkmark for good files and a red 'X' for bad ones.

If you added a file by mistake, just click the 'X' button next to it to remove it.

Download the Package:

Once you've checked all your files, click the "Process and Download .zip" button.

This saves a .zip file to your computer containing only the good textures. It also includes a handy readme.txt report.

What to do next:

The textures in the .zip file are now ready to be imported into a .ytd (texture dictionary) file using a tool like OpenIV. This tool has done the important pre-check to make sure they won't cause performance issues.