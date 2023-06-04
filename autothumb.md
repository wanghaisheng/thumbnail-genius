1. 生成python代码

```
# write a flet python script,load a excel or csv or json , this excel  or csv or json has the following columns, one for video_id,one for result image size, one for title, one for sub-title, one for extra text, one for background image,one for title font size, one for sub-title font size ,one for extra text font size, one for title canvas start coordination,one for subtitle canvas start coordination,one for extra text canvas start coordination. we should take care of csv  column name format, if there is blank  replace it with underscore. take the result image size as input, split it into 12 zone, horizontal 4 and vertically 3.  if canvas start coordination value from csv file is 1-12,  we need conver this number to the left corner coordination of the actual number  zone. then  resize the background image to result image size ,then we need draw text on the new resized background image, for title text  from the  title canvas start coordination, in left to right sequence ,and use title font size value ,we need draw sub-title text from the  sub-title canvas start coordination, in left to right sequence ,and use sub-title font size value ,we need draw extra text from the  extra text canvas start coordination, in left to right sequence ,and use extra text font size value , when draw text we should take care ,sometimes text cannot be drawing one line, we should go to next line at approximately calculate the starting point and text length multiply text font size.  at last for each row in the csv,save the result image to folder and name it with video_id column value. please note  all the text can be english or spanish or chinese ,we need to consider this too
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
2. 代码跑在浏览器里，部署在GitHub pages
```
modify  the script using Pyodide, we can remote deploy this pyodide on github page, deal with the python package needed use micropip.install() ,and allow the user to submit a CSV /excel/json file ,if there is more than one row in the input file, after the processing,we should have a table in the page,support display the input file field and  the result image, if click the result image filed on the page, it can display the image,add a submit button on the page, after use submit a input file,user can hit the submit button to submit the input file to python function and process the image, after processing, we should show the result page
.change the output image folder to relative path of  this code, also make resultImage.src according video id and output image folder.you can utilize the following code:
```

```

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Image Processing</title>
    <style>
      #result-table {
        margin-top: 20px;
        border-collapse: collapse;
      }

      #result-table td {
        border: 1px solid black;
        padding: 5px;
      }

      #result-table img {
        max-width: 200px;
        max-height: 200px;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <input type="file" id="file-input" />
    <button id="submit-btn" disabled>Submit</button>
    <table id="result-table">
      <thead>
        <tr>
          <th>Video ID</th>
          <th>Result Image</th>
        </tr>
      </thead>
      <tbody id="result-body"></tbody>
    </table>

    <script
      type="text/javascript"
      src="https://pyodide-cdn2.iodide.io/v0.23.2/full/pyodide.js"
    ></script>
    <script type="text/javascript">
      async function initializePyodide() {
        await loadPyodide({
          indexURL: "https://pyodide-cdn2.iodide.io/v0.23.2/full/",
        });

        // Install required packages
        await pyodide.loadPackage(["pandas", "Pillow"]);

        // Enable the submit button after Pyodide is initialized
        document.getElementById("submit-btn").disabled = false;
      }

      async function processFile() {
        const fileInput = document.getElementById("file-input");
        const file = fileInput.files[0];
        if (!file) {
          return;
        }

        const fileReader = new FileReader();
        fileReader.onload = async () => {
          const fileData = fileReader.result;
          const fileName = file.name;
          const fileExtension = fileName.split(".").pop().toLowerCase();

          // Convert file data to bytes
          const fileBytes = new Uint8Array(fileData);
          const fileBuffer = pyodide.toPy(fileBytes);

          // Process the file
          await pyodide.runPythonAsync(`
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
    result_image_width, result_image_height = map(int, row["result_image_size"].split("x"))

    # Load and resize background image
    background_image_path = row["background_image"]
    background_image = Image.open(background_image_path)
    background_image = background_image.resize((result_image_width, result_image_height))

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
    title_corner_coord = convert_canvas_coord_to_corner(title_canvas_start, zone_width, zone_height)
    title_font = ImageFont.truetype(title_font_path, title_font_size)
    draw_multiline_text(draw, title, title_corner_coord, title_font, zone_width, title_font_size)

    # Draw subtitle text
    subtitle = row["sub_title"]
    subtitle_font_size = int(row["sub_title_font_size"])
    subtitle_canvas_start = int(row["subtitle_canvas_start_coordination"])
    subtitle_corner_coord = convert_canvas_coord_to_corner(subtitle_canvas_start, zone_width, zone_height)
    subtitle_font = ImageFont.truetype(subtitle_font_path, subtitle_font_size)
    draw_multiline_text(draw, subtitle, subtitle_corner_coord, subtitle_font, zone_width, subtitle_font_size)

    # Draw extra text
    extra_text = row["extra_text"]
    extra_text_font_size = int(row["extra_text_font_size"])
    extra_text_canvas_start = int(row["extra_text_canvas_start_coordination"])
    extra_text_corner_coord = convert_canvas_coord_to_corner(extra_text_canvas_start, zone_width, zone_height)
    extra_text_font = ImageFont.truetype(extra_text_font_path, extra_text_font_size)
    draw_multiline_text(draw, extra_text, extra_text_corner_coord, extra_text_font, zone_width, extra_text_font_size)

    # Save the result image with the video_id as the filename
    video_id = row["video_id"]
    output_folder = "output"
    result_image_path = "${output_folder}/${video_id}.jpg"
    result_image.save(result_image_path)

file_path = "${fileExtension}"
if file_extension == ".xlsx":
    df = pd.read_excel(file_buffer)
elif file_extension == ".csv":
    df = pd.read_csv(file_buffer)
elif file_extension == ".json":
    data = pyodide.toPy(JSON.parse(pyodide.fromPy(file_buffer)))
    df = pd.DataFrame(data)
else:
    raise ValueError("Invalid file format. Only Excel, CSV, and JSON files are supported.")

df.columns = [clean_column_name(col) for col in df.columns]
for _, row in df.iterrows():
    draw_text_on_image(row, zone_width, zone_height)
      `);

          // Display the result table
          const resultBody = document.getElementById("result-body");
          resultBody.innerHTML = "";
          for (const [videoId, _] of Object.entries(df)) {
            const row = document.createElement("tr");
            const videoIdCell = document.createElement("td");
            const resultImageCell = document.createElement("td");
            const resultImage = document.createElement("img");

            videoIdCell.textContent = videoId;
            resultImage.src = `output/${videoId}.jpg`;
            resultImage.addEventListener("click", () =>
              displayImage(resultImage.src)
            );

            resultImageCell.appendChild(resultImage);
            row.appendChild(videoIdCell);
            row.appendChild(resultImageCell);
            resultBody.appendChild(row);
          }
        };
        fileReader.readAsArrayBuffer(file);
      }

      function displayImage(imageSrc) {
        const imageWindow = window.open("", "_blank");
        imageWindow.document.write(
          `<img src="${imageSrc}" style="max-width: 100%; max-height: 100%;">`
        );
      }

      document
        .getElementById("submit-btn")
        .addEventListener("click", processFile);
      initializePyodide();
    </script>
  </body>
</html>
        
        
```
