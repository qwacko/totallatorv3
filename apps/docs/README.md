# Totallator Documentation

This is the VitePress documentation site for Totallator.

## Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Docker

```bash
# Build Docker image
docker build -t totallator-docs .

# Run container
docker run -p 80:80 totallator-docs
```

The documentation will be available at `http://localhost`.
