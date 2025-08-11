# NagreGPT Brand Guidelines

## Logo Assets

### Main Logo (`/public/logo.svg`)
- **Size**: 200x200px
- **Usage**: App headers, icons, general branding
- **Features**: Animated neural network with central "N" lettermark
- **Colors**: Cyan to blue gradient (#00D4FF to #0066AA)

### Horizontal Logo (`/public/logo-horizontal.svg`)
- **Size**: 300x80px  
- **Usage**: Headers, navigation bars, documentation
- **Features**: Logo + company name + tagline
- **Colors**: Cyan to blue gradient with gray tagline

### Favicon (`/public/favicon.svg`)
- **Size**: 32x32px
- **Usage**: Browser tabs, bookmarks
- **Features**: Simplified neural network design
- **Colors**: Cyan to blue gradient

### Large Logo (`/public/logo-large.svg`)
- **Size**: 512x512px
- **Usage**: App stores, social media, high-resolution needs
- **Features**: Enhanced neural network with glow effects
- **Colors**: Full gradient palette

## Brand Colors

### Primary Gradient
- **Start**: #00D4FF (Cyan)
- **Middle**: #0099CC (Blue)
- **End**: #0066AA (Dark Blue)

### Accent Colors
- **Coral**: #FF6B6B
- **Teal**: #4ECDC4

### Neural Network
- **Gradient**: #00D4FF to #FF6B6B (80-60% opacity)

## Typography

### Primary Font
- **Family**: 'Segoe UI', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif
- **Weights**: 400 (Regular), 700 (Bold)

### Brand Name Styling
- **Effect**: Gradient text using primary gradient
- **Weight**: Bold (700)
- **Transform**: None (maintain "NagreGPT" casing)

## Logo Usage

### ✅ Do's
- Use on white or dark backgrounds
- Maintain aspect ratio when scaling
- Keep adequate white space around logo
- Use SVG format for scalability
- Apply gradient text for brand name

### ❌ Don'ts
- Don't stretch or distort the logo
- Don't use on busy backgrounds without backdrop
- Don't change the gradient colors
- Don't separate the neural network from the "N"
- Don't use low-resolution versions

## Implementation

### HTML Meta Tags
```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/logo.svg" />
<meta property="og:image" content="/logo.svg" />
```

### React Component Usage
```tsx
<img 
  src="/logo.svg" 
  alt="NagreGPT Logo" 
  className="w-10 h-10 rounded-xl shadow-lg"
/>
```

### CSS Classes
```css
.brand-text {
  background: linear-gradient(to right, #00D4FF, #0099CC, #0066AA);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

## Brand Message

**Tagline**: "Unlimited Free AI Assistant with High Accuracy"

**Mission**: Making AI accessible to everyone, one conversation at a time

**Values**: 
- Free & Open
- Lightning Fast
- Intelligent Learning
- Beautiful Design
