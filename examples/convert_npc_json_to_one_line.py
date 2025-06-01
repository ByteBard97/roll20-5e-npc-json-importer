import json
import os
import sys # Import sys to read command line arguments

def convert_json_to_single_line_chat_command(input_filepath, output_filename_suffix="_chat.txt"):
    """
    Reads a JSON file, minifies it into a single line, 
    prepends '!5enpcimport ', and saves it to a new .txt file 
    in the same directory as the input file.
    Also prints the command to the console.
    """
    try:
        with open(input_filepath, 'r') as f:
            data = json.load(f) 
        
        minified_json_string = json.dumps(data, separators=(',', ':'))
        chat_command = f"!5enpcimport {minified_json_string}"
        
        # Create output filename based on input filename
        base_name = os.path.splitext(os.path.basename(input_filepath))[0]
        output_filename = f"{base_name}{output_filename_suffix}"
        
        output_dir = os.path.dirname(input_filepath)
        if not output_dir: 
            output_dir = "."
        output_filepath = os.path.join(output_dir, output_filename)

        with open(output_filepath, 'w') as outfile:
            outfile.write(chat_command)
            
        print(f"Successfully created: {output_filepath}")
        print("\nChat command (also saved to file):\n")
        print(chat_command)
        
    except FileNotFoundError:
        print(f"Error: Input file not found at '{input_filepath}'")
    except json.JSONDecodeError as e:
        print(f"Error: Could not decode JSON from '{input_filepath}'. Details: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 convert_json.py <input_json_file_path>")
        print("Example: python3 convert_json.py boss_monster.json")
        print("Or: python3 convert_json.py ../test_npcs/boss_monster.json (if script is in a different dir)")
        sys.exit(1)
        
    input_file_arg = sys.argv[1]
    convert_json_to_single_line_chat_command(input_file_arg)