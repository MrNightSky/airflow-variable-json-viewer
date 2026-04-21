![PyPI](https://img.shields.io/pypi/v/airflow-variable-json-viewer)
![Python](https://img.shields.io/pypi/pyversions/airflow-variable-json-viewer)

# airflow-variable-json-viewer

A better way to work with JSON-based Airflow Variables.

A modern Airflow UI plugin for browsing and editing Variables with 
formatted JSON, search, and an improved user experience.

<p align="center">
  <img src="https://raw.githubusercontent.com/MrNightSky/airflow-variable-json-viewer/main/docs/images/new_version_dark.png" width="800" alt="Variables JSON Viewer plugin UI"/>
  <br/>
  <em>Editing variables with formatted JSON</em>
</p>

## Quick start

```bash
pip install airflow-variable-json-viewer
```

## Why?

Airflow’s Variables UI is now more of a pain than a UX update:

 - Smaller input field — large data barely fits
 - No variable renaming — must recreate instead
 - No JSON formatting (before 3.1.8) — all data in one line


<p align="center">
  <img src="https://raw.githubusercontent.com/MrNightSky/airflow-variable-json-viewer/main/docs/images/default_var_edit.png" width="800" alt="Default Airflow Variables UI"/>
  <br/>
  <em>Default Airflow (<3.1.8) UI without JSON formatting</em>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/MrNightSky/airflow-variable-json-viewer/main/docs/images/default_var_3.1.8.png" width="800" alt="Default Airflow Variables UI"/>
  <br/>
  <em>Default Airflow (3.1.8 or greater) UI with JSON formatting</em>
</p>

This plugin provides a clean and user-friendly interface for working with JSON-based variables.

## Features

- 📋 Browse all Airflow variables with instant search
- ✏️ Edit values with automatic JSON formatting
- 🔍 Easily read and navigate complex nested structures
- 🔒 View variable encryption status
- 🌓 Built-in dark and light modes


<p align="center">
  <img src="https://raw.githubusercontent.com/MrNightSky/airflow-variable-json-viewer/main/docs/images/new_version_light.png" width="800" alt="Light mode UI"/>
  <br/>
  <em>Light mode support</em>
</p>


## Compatibility

- Apache Airflow **3.1+**
- Python **3.8+**

---

## Installation

You can install the plugin either manually or via pip:

### Option 1: Manual copy to `plugins` folder

1. Copy the `variable_json_viewer/` package to your Airflow `plugins` folder:

   ```
   $AIRFLOW_HOME/plugins/variable_json_viewer/
   ├── __init__.py
   ├── plugin.py
   └── static/
       ├── index.html
       ├── app.js
       └── styles.css
   ```

2. Restart Airflow (webserver and scheduler).

### Option 2: Installation via pip

```bash
pip install airflow-variable-json-viewer
```

After installation, restart Airflow — the plugin will be automatically discovered.



---

## Usage

After installation, a new menu item **"Variables JSON Viewer"** will appear in 
the Airflow navigation menu under the **Admin** section.

<p align="center">
  <img src="https://raw.githubusercontent.com/MrNightSky/airflow-variable-json-viewer/main/docs/images/admin_section.png" width="300"/>
</p>

Or access it directly via:

```
http://<your-airflow-host>/variable-json/
```

---

## License

MIT
