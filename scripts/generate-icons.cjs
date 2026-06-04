const fs = require("fs/promises");
const path = require("path");
const { transform } = require("@svgr/core");

const rootDir = path.resolve(__dirname, "..");
const svgDir = path.join(rootDir, "assets", "svg");
const outputFile = path.join(rootDir, "src", "components", "icons.tsx");

const header = `import Svg, {
  ClipPath,
  Defs,
  G,
  LinearGradient,
  Mask,
  Path,
  RadialGradient,
  Rect,
  Stop,
  type SvgProps,
} from "react-native-svg";

type IconProps = SvgProps & {
  size?: number;
  color?: string;
  active?: boolean;
  top?: boolean;
  bottom?: boolean;
};

`;

function toPascalCase(fileName) {
  const baseName = path.basename(fileName, ".svg");
  const parts = baseName.match(/[A-Za-z0-9]+/g) ?? [];
  return parts
    .map((part) => {
      if (/^[A-Z0-9]+$/.test(part)) {
        return part;
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

function preprocessSvg(source) {
  const svgMatch = source.replace(/\r\n/g, "\n").match(/<svg[\s\S]*<\/svg>/);
  if (!svgMatch) {
    throw new Error("No <svg> element found");
  }

  return svgMatch[0]
    .replace(/\s+xmlns="[^"]*"/g, "")
    .replace(/\s+v-bind="\$props"/g, "")
    .replace(/:fill="props\.active \? 'currentColor' : `#E0E0E0`"/g, 'fill="__ICON_ACTIVE_FILL__"')
    .replace(/:fill="props\.top \? 'currentColor' : `#E0E0E0`"/g, 'fill="__ICON_TOP_FILL__"')
    .replace(/:fill="props\.bottom \? 'currentColor' : `#E0E0E0`"/g, 'fill="__ICON_BOTTOM_FILL__"');
}

function makeTemplate() {
  return (variables, { tpl }) => tpl`
export function ${variables.componentName}({
  size = 24,
  color = "currentColor",
  ...props
}: IconProps) {
  return ${variables.jsx};
}
`;
}

function postprocessCode(code) {
  return code
    .replace(/import[^;]+;\n/g, "")
    .replace(/fill="__ICON_ACTIVE_FILL__"/g, "fill={props.active ? color : \"#E0E0E0\"}")
    .replace(/fill="__ICON_TOP_FILL__"/g, "fill={props.top ? color : \"#E0E0E0\"}")
    .replace(/fill="__ICON_BOTTOM_FILL__"/g, "fill={props.bottom ? color : \"#E0E0E0\"}")
    .trim();
}

async function main() {
  const entries = (await fs.readdir(svgDir))
    .filter((entry) => entry.toLowerCase().endsWith(".svg"))
    .sort((a, b) => a.localeCompare(b));

  const usedNames = new Map();
  const generatedNames = new Set();
  const components = [];

  for (const entry of entries) {
    const sourcePath = path.join(svgDir, entry);
    const raw = await fs.readFile(sourcePath, "utf8");
    const svg = preprocessSvg(raw);
    const baseComponentName = `Icon${toPascalCase(entry)}`;
    const currentCount = usedNames.get(baseComponentName) ?? 0;
    usedNames.set(baseComponentName, currentCount + 1);
    const componentName = currentCount === 0 ? baseComponentName : `${baseComponentName}${currentCount + 1}`;
    generatedNames.add(componentName);

    const code = await transform(
      svg,
      {
        native: true,
        typescript: true,
        dimensions: false,
        expandProps: "end",
        prettier: true,
        plugins: ["@svgr/plugin-svgo", "@svgr/plugin-jsx"],
        replaceAttrValues: {
          currentColor: "{color}",
        },
        svgProps: {
          width: "{size}",
          height: "{size}",
        },
        template: makeTemplate(),
        svgoConfig: {
          plugins: [
            {
              name: "preset-default",
              params: {
                overrides: {
                  removeViewBox: false,
                },
              },
            },
          ],
        },
      },
      { componentName },
    );

    components.push(postprocessCode(code));
  }

  const aliases = [
    ["IconClose", "IconCrossLarge"],
    ["IconExpand", "IconMaximizeArrows"],
    ["IconUsers", "IconProfile2User"],
  ]
    .filter(([, target]) => generatedNames.has(target))
    .map(([alias, target]) => `export const ${alias} = ${target};`);

  await fs.writeFile(outputFile, `${header}${components.join("\n\n")}\n\n${aliases.join("\n")}\n`, "utf8");
  console.log(`Generated ${components.length} icons in ${path.relative(rootDir, outputFile)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
