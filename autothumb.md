1.

```
To run the script in a browser using Pyodide, remote deploy this pyodide use github page, deal with the python package needed use micropip.install() ,and allow the user to submit a CSV /excel/json file ,if there is more than one row in the input file, after the processing,we should have a table in the page,support display the input file field and  the result image, if click the result image filed on the page, it can display the image, you can utilize the following code:
import pandas as pd
import json
from PIL import Image, ImageDraw, ImageFont
import os


def calculate_text_size(text, font):
    width, height = font.getsize(text)
    return width, height


def calculate_text_lines(text, font, max_width):
    lines = []
    words = text.split()
    current_line = words[0]
    for word in words[1:]:
        line_width, _ = calculate_text_size(current_line + " " + word, font)
        if line_width <= max_width:
            current_line += " " + word
        else:
            lines.append(current_line)
            current_line = word
    lines.append(current_line)
    return lines


def convert_canvas_coord_to_corner(canvas_coord, zone_width, zone_height):
    zone_number = canvas_coord - 1
    zone_column = zone_number % 4
    zone_row = zone_number // 4
    corner_x = zone_column * zone_width
    corner_y = zone_row * zone_height
    return corner_x, corner_y


def draw_multiline_text(draw, text, start_coord, font, max_width, line_spacing):
    lines = calculate_text_lines(text, font, max_width)
    x, y = start_coord
    for line in lines:
        draw.text((x, y), line, font=font)
        x, y = start_coord[0], y + line_spacing


def clean_column_name(column_name):
    return column_name.replace(" ", "_")


def draw_text_on_image(row, zone_width, zone_height):
    result_image_width, result_image_height = map(
        int, row["result_image_size"].split("x")
    )

    # Load and resize background image
    background_image_path = row["background_image"]
    background_image = Image.open(background_image_path)
    background_image = background_image.resize(
        (result_image_width, result_image_height)
    )

    # Create a new image with the resized background
    result_image = Image.new("RGB", (result_image_width, result_image_height))
    result_image.paste(background_image, (0, 0))

    # Create ImageDraw object
    draw = ImageDraw.Draw(result_image)

    # Load the font files
    title_font_path = row["title_font"]
    subtitle_font_path = row["subtitle_font"]
    extra_text_font_path = row["extra_text_font"]

    # Split the result image into 12 zones
    zones_horizontal = 4
    zones_vertical = 3
    zone_width = result_image_width // zones_horizontal
    zone_height = result_image_height // zones_vertical

    # Draw title text
    title = row["title"]
    title_font_size = int(row["title_font_size"])
    title_canvas_start = int(row["title_canvas_start_coordination"])
    title_corner_coord = convert_canvas_coord_to_corner(
        title_canvas_start, zone_width, zone_height
    )
    title_font = ImageFont.truetype(title_font_path, title_font_size)
    draw_multiline_text(
        draw, title, title_corner_coord, title_font, zone_width, title_font_size
    )

    # Draw subtitle text
    subtitle = row["sub_title"]
    subtitle_font_size = int(row["sub_title_font_size"])
    subtitle_canvas_start = int(row["subtitle_canvas_start_coordination"])
    subtitle_corner_coord = convert_canvas_coord_to_corner(
        subtitle_canvas_start, zone_width, zone_height
    )
    subtitle_font = ImageFont.truetype(subtitle_font_path, subtitle_font_size)
    draw_multiline_text(
        draw,
        subtitle,
        subtitle_corner_coord,
        subtitle_font,
        zone_width,
        subtitle_font_size,
    )

    # Draw extra text
    extra_text = row["extra_text"]
    extra_text_font_size = int(row["extra_text_font_size"])
    extra_text_canvas_start = int(row["extra_text_canvas_start_coordination"])
    extra_text_corner_coord = convert_canvas_coord_to_corner(
        extra_text_canvas_start, zone_width, zone_height
    )
    extra_text_font = ImageFont.truetype(extra_text_font_path, extra_text_font_size)
    draw_multiline_text(
        draw,
        extra_text,
        extra_text_corner_coord,
        extra_text_font,
        zone_width,
        extra_text_font_size,
    )

    # Save the result image with the video_id as the filename
    video_id = row["video_id"]
    result_image.save(f"output/{video_id}.jpg")


def process_file(file_path):
    _, file_extension = os.path.splitext(file_path)
    if file_extension == ".xlsx":
        df = pd.read_excel(file_path)
    elif file_extension == ".csv":
        df = pd.read_csv(file_path)
    elif file_extension == ".json":
        with open(file_path) as f:
            data = json.load(f)
        df = pd.DataFrame(data)
    else:
        raise ValueError(
            "Invalid file format. Only Excel, CSV, and JSON files are supported."
        )

    df.columns = [clean_column_name(col) for col in df.columns]
    for _, row in df.iterrows():
        draw_text_on_image(row, zone_width, zone_height)


def main():
    file_path = "input.xlsx"  # Replace with your file path
    process_file(file_path)


if __name__ == "__main__":
    # Create output directory if it doesn't exist
    os.makedirs("output", exist_ok=True)
    main()

```

2.
modify the above code, after use submit a input file, automatically process the image, after processing, we should show the result page


```
<!DOCTYPE html>
<html>
  <head>
    <script>
      async function loadPyodideAndRunScript() {
        // Load Pyodide and required packages
        await loadPyodide({ indexURL : 'https://cdn.jsdelivr.net/pyodide/v0.18.1/full/' });
        await pyodide.loadPackage(['pandas', 'Pillow']);

        // Define the Python script
        const pythonScript = `
import pandas as pd
import json
from PIL import Image, ImageDraw, ImageFont
import os

def calculate_text_size(text, font):
    width, height = font.getsize(text)
    return width, height

def calculate_text_lines(text, font, max_width):
    lines = []
    words = text.split()
    current_line = words[0]
    for word in words[1:]:
        line_width, _ = calculate_text_size(current_line + " " + word, font)
        if line_width <= max_width:
            current_line += " " + word
        else:
            lines.append(current_line)
            current_line = word
    lines.append(current_line)
    return lines

def convert_canvas_coord_to_corner(canvas_coord, zone_width, zone_height):
    zone_number = canvas_coord - 1
    zone_column = zone_number % 4
    zone_row = zone_number // 4
    corner_x = zone_column * zone_width
    corner_y = zone_row * zone_height
    return corner_x, corner_y

def draw_multiline_text(draw, text, start_coord, font, max_width, line_spacing):
    lines = calculate_text_lines(text, font, max_width)
    x, y = start_coord
    for line in lines:
        draw.text((x, y), line, font=font)
        x, y = start_coord[0], y + line_spacing

def clean_column_name(column_name):
    return column_name.replace(" ", "_")

def draw_text_on_image(row, zone_width, zone_height):
    result_image_width, result_image_height = map(
        int, row["result_image_size"].split("x")
    )

    # Load and resize background image
    background_image_path = row["background_image"]
    background_image = Image.open(background_image_path)
    background_image = background_image.resize(
        (result_image_width, result_image_height)
    )

    # Create a new image with the resized background
    result_image = Image.new("RGB", (result_image_width, result_image_height))
    result_image.paste(background_image, (0, 0))

    # Create ImageDraw object
    draw = ImageDraw.Draw(result_image)

    # Load the font files
    title_font_path = row["title_font"]
    subtitle_font_path = row["subtitle_font"]
    extra_text_font_path = row["extra_text_font"]

    # Split the result image into 12 zones
    zones_horizontal = 4
    zones_vertical = 3
    zone_width = result_image_width // zones_horizontal
    zone_height = result_image_height // zones_vertical

    # Draw title text
    title = row["title"]
    title_font_size = int(row["title_font_size"])
    title_canvas_start = int(row["title_canvas_start_coordination"])
    title_corner_coord = convert_canvas_coord_to_corner(
        title_canvas_start, zone_width, zone_height
    )
    title_font = ImageFont.truetype(title_font_path, title_font_size)
    draw_multiline_text(
        draw, title, title_corner_coord, title_font, zone_width, title_font_size
    )

    # Draw subtitle text
    subtitle = row["sub_title"]
    subtitle_font_size = int(row["sub_title_font_size"])
    subtitle_canvas_start = int(row["subtitle_canvas_start_coordination"])
    subtitle_corner_coord = convert_canvas_coord_to_corner(
        subtitle_canvas_start, zone_width, zone_height
    )
    subtitle_font = ImageFont.truetype(subtitle_font_path, subtitle_font_size)
    draw_multiline_text(
        draw,
        subtitle,
        subtitle_corner_coord,
        subtitle_font,
        zone_width,
        subtitle_font_size,
    )

    # Draw extra text
    extra_text = row["extra_text"]
    extra_text_font_size = int(row["extra_text_font_size"])
    extra_text_canvas_start = int(row["extra_text_canvas_start_coordination"])
    extra_text_corner_coord = convert_canvas_coord_to_corner(
        extra_text_canvas_start, zone_width, zone_height
    )
    extra_text_font = ImageFont.truetype(extra_text_font_path, extra_text_font_size)
    draw_multiline_text(
        draw,
        extra_text,
        extra_text_corner_coord,
        extra_text_font,
        zone_width,
        extra_text_font_size,
    )

    # Save the result image with the video_id as the filename
    video_id = row["video_id"]
    result_image.save(f"output/{video_id}.jpg")

def process_file(file_path):
    _, file_extension = os.path.splitext(file_path)
    if file_extension == ".xlsx":
        df = pd.read_excel(file_path)
    elif file_extension == ".csv":
        df = pd.read_csv(file_path)
    elif file_extension == ".json":
        with open(file_path) as f:
            data = json.load(f)
        df = pd.DataFrame(data)
    else:
        raise ValueError(
            "Invalid file format. Only Excel, CSV, and JSON files are supported."
        )

    df.columns = [clean_column_name(col) for col in df.columns]
    for _, row in df.iterrows():
        draw_text_on_image(row, zone_width, zone_height)

        # Call the displayResultPage function after processing the file
        pyodide.globals.displayResultPage();
      `;
      
        // Call the process_file function immediately after the file is loaded
        await pyodide.runPythonAsync(pythonScript);
      }

      function displayResultPage() {
        // Generate the result page with the processed data
        const resultTable = document.getElementById('result-table');
        resultTable.innerHTML = '<h2>Result Page</h2><p>The file has been processed successfully.</p>';
      }

      function initialize() {
        // Add event listener to the file input field
        const fileInput = document.getElementById('file-input');
        fileInput.addEventListener('change', handleFileUpload);

        // Call the loadPyodideAndRunScript function to load Pyodide and run the script
        loadPyodideAndRunScript();
      }

      function handleFileUpload(event) {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
          const fileData = e.target.result;
          pyodide.runPythonAsync(`
import base64
file_data = "${fileData}"
decoded_data = base64.b64decode(file_data)
with open('uploaded_file', 'wb') as f:
    f.write(decoded_data)
          `);
        };

        reader.readAsDataURL(file);
      }

      // Initialize the script when the page is loaded
      window.addEventListener('DOMContentLoaded', initialize);
    </script>
  </head>
  <body>
    <h2>Image Processing</h2>
    <input type="file" id="file-input">
    <table id="result-table"></table>
  </body>
</html>

```