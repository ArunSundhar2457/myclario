# Architecture rules

- Public landing scroll chapters use a shared ScrollStage with reversible scroll progress, adaptive pinning only when all content fits, and unpinned final states for reduced motion; this prevents clipping and keeps pacing consistent without touching authenticated app behavior.