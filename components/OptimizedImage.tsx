import Image, { ImageProps } from 'next/image';

interface OptimizedImageProps extends ImageProps {
  lazy?: boolean;
}

export default function OptimizedImage({
  lazy = true,
  priority,
  alt,
  ...props
}: OptimizedImageProps) {
  return (
    <Image
      {...props}
      alt={alt}
      loading={priority ? undefined : lazy ? 'lazy' : 'eager'}
      priority={priority}
      quality={props.quality || 85}
      placeholder={props.placeholder || 'blur'}
      blurDataURL={
        props.blurDataURL ||
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      }
    />
  );
}
