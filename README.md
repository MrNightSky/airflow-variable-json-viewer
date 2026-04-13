# airflow-variable-json-viewer

An Apache Airflow plugin that adds a dedicated page for viewing and editing variables with JSON value display.

## Features

- 📋 View all Airflow variables in a list
- ✏️ Edit variable values with JSON pretty-printing
- 📁 Import variables from `variables.json` file (from `AIRFLOW_HOME`)
- 🔒 Display variable encryption status

## Compatibility

- Apache Airflow **3.1+**
- Python **3.8+**

---

## Installation

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

After installation, restart Airflow — the plugin will be automatically discovered via the `airflow.plugins` entry point.

---

## Usage

After installation, a new menu item **"Variables JSON Viewer"** will appear in the Airflow navigation menu under the **Admin** section.

The plugin is available at:

```
http://<your-airflow-host>/variable-json/
```

### Import from file

Place a `variables.json` file in the `AIRFLOW_HOME` directory:

```json
{
  "my_variable": "some_value",
  "another_variable": {"key": "value"}
}
```

Then click the **"Import from file"** button in the plugin UI (if available) or use the API endpoint.

---

## Project Structure

```
airflow-variable-json-viewer/
├── variable_json_viewer/       # Plugin Python package
│   ├── __init__.py
│   ├── plugin.py
│   └── static/
│       ├── index.html
│       ├── app.js
│       └── styles.css
├── pyproject.toml
├── README.md
```

---

## License

MIT
