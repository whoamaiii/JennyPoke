# Custom Card Images

Place your custom Pokemon card images here!

## Usage

1. Create or download custom card images
2. Save them in this directory
3. Reference them in `src/data/custom-cards/customCardDatabase.json` using the `customImage` field

## Example

If you have a file named `christmas-charizard.png` in this directory:

```json
{
  "id": "custom-024",
  "baseCardId": "base1-4",
  "name": "Forever Charizard",
  "customImage": "christmas-charizard.png",
  ...
}
```

## Image Requirements

- **Format**: PNG, JPG, or WebP
- **Size**: Recommended 734x1024 pixels (Pokemon card dimensions)
- **Aspect Ratio**: 734:1024 (standard Pokemon card)

## Creating Custom Images

### Option 1: Use Base Card + Overlay
1. Download the base card image from https://pokemontcg.io/
2. Add text, stickers, or overlays using image editing software
3. Export as PNG

### Option 2: AI Generation
- Use AI image generators (DALL-E, Midjourney, etc.)
- Prompt: "Pokemon trading card style, [your description], Christmas themed"

### Option 3: Template Editors
- Use online Pokemon card creators
- Customize existing card templates

## Note

If no custom image is specified, the system will automatically use the base card image from the Pokemon TCG API.
