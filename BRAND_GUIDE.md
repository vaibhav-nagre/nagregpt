# NagreGPT Brand Guidelines

## Logo Assets

### Main Logo (`/public/logo.svg`)
- **Size**: 200x200px
- **Usage**: App headers, icons, general branding
- **Features**: Premium hexagonal design with sophisticated "N" lettermark and AI network visualization
- **Colors**: Enterprise-grade gradient (#667EEA to #1E3A8A) with premium accent colors

### Horizontal Logo (`/public/logo-horizontal.svg`)
- **Size**: 350x80px  
- **Usage**: Headers, navigation bars, documentation, professional presentations
- **Features**: Logo + enhanced company name + sophisticated tagline
- **Colors**: Premium gradient with professional typography and enterprise styling

### Favicon (`/public/favicon.svg`)
- **Size**: 32x32px
- **Usage**: Browser tabs, bookmarks, app icons
- **Features**: Simplified hexagonal design optimized for small sizes
- **Colors**: Premium gradient maintaining brand consistency

### Large Logo (`/public/logo-large.svg`)
- **Size**: 512x512px
- **Usage**: App stores, social media, high-resolution marketing materials, enterprise presentations
- **Features**: Full premium design with enhanced network visualization and enterprise-grade effects
- **Colors**: Complete premium gradient palette with sophisticated animations

## Brand Colors

### Primary Premium Gradient
- **Start**: #667EEA (Premium Indigo)
- **Mid**: #764BA2 (Royal Purple)
- **Deep**: #4F46E5 (Enterprise Blue)
- **End**: #1E3A8A (Corporate Dark Blue)

### Accent Colors
- **Cyan**: #06B6D4 (Tech Blue)
- **Electric**: #0EA5E9 (Innovation Blue)
- **Highlight**: #F59E0B (Premium Gold)
- **Energy**: #EF4444 (Dynamic Red)

### Enterprise Network
- **Gradient**: #4F46E5 to #06B6D4 (Premium tech aesthetic)
- **Highlight**: #F59E0B to #EF4444 (Energy and innovation)

## Typography

### Primary Font Stack
- **Family**: 'SF Pro Display', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif
- **Weights**: 400 (Regular), 500 (Medium), 700 (Bold)
- **Usage**: Premium, clean, enterprise-grade typography

### Brand Name Styling
- **Effect**: Premium gradient text using primary brand gradient
- **Weight**: Bold (700) for impact and authority
- **Transform**: Maintains "NagreGPT" casing for brand consistency
- **Enhancement**: Text shadow for depth and professionalism

### Tagline Styling
- **Text**: "ADVANCED AI INTELLIGENCE PLATFORM"
- **Style**: All caps with letter spacing for premium feel
- **Weight**: Medium (500) for professional appearance
- **Color**: Professional gray (#4B5563) with high opacity

## Logo Usage

### ✅ Do's
- Use on white, dark, or subtle gradient backgrounds
- Maintain aspect ratio when scaling for professional appearance
- Keep generous white space around logo for premium feel
- Use SVG format for crisp scalability at all sizes
- Apply gradient text effects for brand name consistency
- Use enterprise styling for professional contexts
- Maintain hexagonal design integrity

### ❌ Don'ts
- Don't stretch, distort, or modify the hexagonal proportions
- Don't use on busy backgrounds without proper backdrop
- Don't alter the premium gradient color schemes
- Don't separate design elements from their intended context
- Don't use low-resolution versions for professional materials
- Don't compromise the sophisticated network visualization
- Don't use outdated cyan/orange color schemes

## Implementation

### HTML Meta Tags
```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="apple-touch-icon" href="/logo.svg" />
<meta property="og:image" content="/logo-large.svg" />
```

### React Component Usage
```tsx
<img 
  src="/logo.svg" 
  alt="NagreGPT - Advanced AI Intelligence Platform" 
  className="w-10 h-10 rounded-xl shadow-lg filter drop-shadow-lg"
/>
```

### CSS Classes
```css
.brand-text {
  background: linear-gradient(to right, #667EEA, #4F46E5, #1E3A8A);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(30, 58, 138, 0.3);
}

.premium-logo {
  filter: drop-shadow(0 4px 8px rgba(30, 58, 138, 0.2));
  transition: transform 0.3s ease;
}

.premium-logo:hover {
  transform: scale(1.05);
}
```

## Brand Message

**Enhanced Tagline**: "Advanced AI Intelligence Platform"

**Mission**: Democratizing enterprise-grade AI technology for everyone, setting new standards in conversational intelligence

**Values**: 
- **Enterprise Excellence**: Professional-grade AI capabilities
- **Innovation Leadership**: Cutting-edge technology and design
- **Accessible Intelligence**: Premium AI for all users
- **Design Sophistication**: Beautiful, intuitive user experience

**Brand Positioning**: Premium AI platform that combines enterprise-grade capabilities with accessible design, targeting users who value both powerful functionality and sophisticated aesthetics.

## Brand Personality

- **Sophisticated**: Premium design language and enterprise-grade quality
- **Innovative**: Cutting-edge AI technology with forward-thinking approach
- **Accessible**: User-friendly despite advanced capabilities
- **Trustworthy**: Professional appearance inspiring confidence
- **Dynamic**: Animated elements suggesting active intelligence
