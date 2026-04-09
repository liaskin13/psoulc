# PSC Universe - Lessons Learned

## Self-Improvement Loop (Protocol #3)
This file captures patterns, mistakes, and corrections to prevent "Shadow Gaps" from repeating.

### Session: Phase 1 Ignition (April 2, 2026)

#### Typography Implementation
- **Lesson**: Always verify font imports and weights before implementation
- **Pattern**: Comfortaa 700 weight requires explicit font-weight declaration
- **Prevention**: Test font loading in isolation before integrating into components

#### Color Scheme Standards
- **Lesson**: Use CSS custom properties for all color definitions
- **Pattern**: Define semantic color names (midnight-vault, aged-stone, burnished-copper)
- **Prevention**: Create variables.css first, then reference in components

#### Component Architecture
- **Lesson**: Keep components minimalist and focused on single responsibilities
- **Pattern**: Sovereignty Gate should only handle access logic, not styling concerns
- **Prevention**: Separate logic from presentation layers

#### CSS Organization
- **Lesson**: Import variables.css at the top of main stylesheet for consistent theming
- **Pattern**: Use CSS custom properties for all design tokens
- **Prevention**: Establish variables.css as single source of truth for colors and typography

#### Font Loading Strategy
- **Lesson**: Use Google Fonts with preconnect for optimal loading performance
- **Pattern**: Include both font weights and styles needed upfront
- **Prevention**: Audit font usage before implementation to minimize requests

#### Void State Visibility Breach (April 2, 2026)
- **Root Cause**: Missing root route "/" in React Router configuration
- **Symptom**: Page rendered as solid black void with no content
- **Pattern**: Routes defined for specific paths but no default landing page
- **Prevention**: Always include root route "/" when Entry/Home component exists
- **Fix Applied**: Added `<Route path="/" element={<Entry />} />` to Routes

#### Duplicate Import PARSE_ERROR (April 2, 2026)
- **Root Cause**: Multiple edit sessions caused file corruption with duplicate React imports
- **Symptom**: Build fails with "Identifier `React` has already been declared" error
- **Pattern**: Large React component files accumulate duplicate imports during iterative development
- **Prevention**: Manual line-by-line audit of import statements before every save
- **Action**: Check head and foot of files for redundant imports that break the entire render pipeline

#### Sovereign Seal CSS Architecture (April 2, 2026)
- **Pattern**: Create dedicated identity.css for brand elements with semantic class names
- **Implementation**: Use .psc-seal class with Comfortaa 700 weight for authoritative presence
- **Typography**: Tightened letter-spacing (-0.05em) creates structural "Stone" feel
- **Color**: Burnished-copper (#A36942) provides frequency highlight against midnight-vault
- **Organization**: Separate identity styles from component styles for maintainability

#### Access Code Logic Implementation (April 2, 2026)
- **Pattern**: Centralized access control with mode-based routing (GOD_MODE, ARCHITECT_MODE, AMETHYST_MODE)
- **Sequence**: Flash animation (0.8s) followed by mode transition and conditional flyby
- **Error Handling**: UNAUTHORIZED_FREQUENCY state for invalid access codes
- **State Management**: Separate flash, vaultMode, and errorCode states for clean separation of concerns

#### Sovereign Entryway Implementation (April 2, 2026)
- **Grid System**: 12×30 dp grid with active 12/30 cell for mobile interaction trigger
- **Mobile UX**: Amber Nixie Keypad overlay with tactile button feedback and clear visual hierarchy
- **Animation Stack**: Framer Motion for cinematic flyby with orbital mechanics and scaling effects
- **Permission Engine**: Centralized permissions_ledger state with Architect-only modification rights
- **Access Modes**: GOD_MODE (0528) with flyby, ARCHITECT_MODE (7677) direct access, AMETHYST_MODE (4096) restricted
- **Flash Sequence**: 0.8s full-screen white overlay for atmospheric coherence verification