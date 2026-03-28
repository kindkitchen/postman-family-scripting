async function magic_to_json_string(options: {
  input_path_to_magic_js?: string;
  output_path_to_magic_json?: string;
} = {}) {
  const {
    input_path_to_magic_js = "./magic.js",
    output_path_to_magic_json = "./magic.json",
  } = options;
  const content = await Deno.readTextFile(input_path_to_magic_js);
  const contentJ = JSON.stringify(content);

  await Deno.writeTextFile(output_path_to_magic_json, contentJ);
}

if (import.meta.main) {
  await magic_to_json_string();
}
