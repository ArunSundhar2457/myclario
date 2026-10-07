# Architecture rules

- Public landing scroll chapters use a shared ScrollStage with reversible scroll progress, adaptive pinning only when all content fits, and unpinned final states for reduced motion; this prevents clipping and keeps pacing consistent without touching authenticated app behavior.
- Landing section separation is owned by the public main layout, and Highlights sizes its preview to viewport height; this keeps inter-section gaps uniform and allows safe scroll holds on shorter desktop screens.