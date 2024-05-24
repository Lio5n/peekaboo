# Peekaboo: Enhanced Privacy for Your Obsidian Vault

Peekaboo is an Obsidian plugin designed to selectively hide and reveal files and folders within your vault. By setting a password, you can add a layer of privacy, protecting sensitive notes from casual view.

**Important Note:** Peekaboo provides a convenient way to visually conceal notes within your Obsidian workflow. However, it's essential to understand that it does not encrypt your files. Hidden files may still be accessible through Obsidian's search, graph view, or directly from your computer's file system. 

## Features

- **Password-Protected Privacy:** Secure your hidden file configuration with a password.
- **Granular Control:**  Hide individual files, entire folders, or use wildcards for pattern-based hiding.
- **Quick Toggle Visibility:** Conveniently show or hide configured items using a ribbon icon.
- **Command Line Efficiency:** Manage visibility directly from your command line.

## Installation

1. In Obsidian, navigate to `Settings` -> `Community plugins`.
2. Click `Browse` and search for "Peekaboo."
3. Click `Install` and then `Enable` to activate the plugin.

## Usage

1. **Set Your Password:** Upon activation, you'll be prompted to set a password to protect your hidden file configuration. 
2. **Configure Hidden Items:**
   - Access Peekaboo's settings to specify the files and folders you want to hide.
   - List each item on a new line, including the full directory path (e.g., `My Folder/Secret Note.md`).
   - You can omit file extensions (e.g., `.md`).
   - Use the wildcard character `*` to hide multiple files matching a pattern (e.g., `My Folder/Meeting Notes*` to hide all files starting with "Meeting Notes"). Note: The wildcard can only be used at the end of a file name.
   - Example configuration:
     ```
     Folder1
     Folder2/
     Folder3/Note1
     Folder4/Note2.md
     Folder5/Not*
     ```
3. **Toggle Visibility:** Use the ribbon icon or command line commands to quickly switch between showing and hiding your configured items.

## Command Line Usage

- **`Toggle Configured Files Visibility`:** Instantly toggle the visibility of all configured files and folders.

## Support and Feedback

Encountered an issue or have a suggestion? Please open an issue on the [GitHub repository](https://github.com/Lio5n/peekaboo).
