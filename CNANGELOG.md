# Changelog

## [0.1.0] - 2024-05-24 

### Added

- Initial release of Peekaboo, an Obsidian plugin for enhancing vault privacy.
- Password protection: Secure your hidden file configuration with a password.
- Granular hiding: 
    - Hide individual files or entire folders.
    - Use wildcard patterns (e.g., `Notes*`) for flexible selection.
- Quick visibility toggle:
    - Convenient ribbon icon for showing/hiding configured items.
    - Command line command (`Toggle Configured Files Visibility`) for quick access. 

### Important Note

- Peekaboo provides visual privacy within Obsidian but does **not encrypt** files.
- Hidden items may still be accessible via Obsidian's search, graph view, or the computer's file system. 


## [0.2.0] - 2024-05-26

### Added

- **Ribbon Icon Visibility Toggle:**  Enhance your privacy by optionally hiding the Peekaboo ribbon icon via a new setting.
- **Configured Exception Files:**  Maintain visibility of specific files within hidden directories. Note: Folder exceptions are not currently supported.
- **New Commands:**  Enjoy greater control with these commands:
    - `Show Specified File`:  Reveals a specific file, even if hidden within a directory.
    - `Show All Configured Files`:  Makes all configured files and folders visible.
    - `Hide All Configured Files`:  Hides all configured files and folders.

### Changed

- **Improved Ribbon Icon Functionality:**  The ribbon icon now opens a menu with the new commands, providing quick access to all Peekaboo actions. 
- **Enhanced Dialog Design:**  Enjoy a more visually appealing and user-friendly dialog experience.


## [0.2.1] - 2024-05-29

### Improvements:

- Refactored codebase for improved organization and maintainability.
- Moved all CSS styles to a dedicated styles.css file for better management.


## [0.2.2] - 2024-05-30

### Removed:

- Removed the setting to hide the ribbon icon.

### Changed:

- Updated code to comply with Obsidian plugin API guidelines.


## [1.0.0] - 2024-06-01

### Changed:

- Restore the ability to hide ribbon icons
