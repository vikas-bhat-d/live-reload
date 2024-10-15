# Live-Reloading Static File Server

## Introduction

**Live-Reloading Static File Server** is a Node.js application that serves static files and automatically reloads the browser when changes are detected in the watched directory. It’s ideal for local development, offering real-time updates on file changes.

## Features

- Live reloading of browser on file changes.
- Static file serving with directory listings.
- WebSocket-based real-time communication for live reloads.
- Configurable via command-line for file paths and port.
- Simple build process that generates a standalone `livereload.exe`.
- Comprehensive logging using Winston.

## Installation

### Prerequisites

- **Node.js** (version 14.0.0 or higher)
- **npm** (Node Package Manager)

### Steps

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/your-repo-name.git
   cd your-repo-name
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Build the Application**

   Run the following command to build the application and generate the `livereload.exe` file:

   ```bash
   npm run build
   ```

   This will generate the `livereload.exe` file in the root directory of the project.

## Usage

### Setting up the environment

1. **Prepare the `runtime` directory:**

   - Create a folder named `runtime`.
   - Inside the `runtime` folder, create a subdirectory called `public`.

   Your folder structure should look like this:

   ```
   [Your folder]
   ├── livereload.exe
   ├── runtime
       └── public
   ```
   **runtime folder from this repository can be used**

2. **Add `livereload.exe` to the system PATH:**

   To run `livereload` from any directory in your terminal, follow these steps:

   - Move the `livereload.exe` file and the `runtime` folder to the same location.
   - Add the path to this folder (containing `livereload.exe`) to your system’s environment variables (`PATH`).

   Once added, you can use the `livereload` command from any directory.

### Running the Server

1. **Run the `livereload` command** from any directory in your terminal:

   ```bash
   livereload [relative-path] --port [port-number]
   ```

   - `[relative-path]`: The directory to watch for changes (defaults to `./`).
   - `--port`: The port number for the server (defaults to `3000`).

2. **Example:**

   ```bash
   livereload ./src --port 4000
   ```

3. **Access the server** by navigating to `http://localhost:[port]` in your browser (default is `http://localhost:3000`).

## Requirements for Running `livereload.exe`

- Ensure that the `runtime` directory and its subdirectory `public` are in the same directory as `livereload.exe`.
- The application will fail to run if the `runtime/public` folder is missing.

## Author

- **Author Name**: Vikas Bhat D
- **GitHub**: [https://github.com/vikas-bhat-d/](https://github.com/vikas-bhat-d/)
- **LinkedIn**: [https://www.linkedin.com/in/vikas-bhat-d/](https://www.linkedin.com/in/vikas-bhat-d/)
