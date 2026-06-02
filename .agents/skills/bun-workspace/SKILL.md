> ## Documentation Index
> Fetch the complete documentation index at: https://bun.com/docs/llms.txt
> Use this file to discover all available pages before exploring further.

# Workspaces

> Develop complex monorepos with multiple independent packages

Bun supports [`workspaces`](https://docs.npmjs.com/cli/v9/using-npm/workspaces?v=true#description) in `package.json`. Workspaces let you develop complex software as a *monorepo* consisting of several independent packages.

It's common for a monorepo to have the following structure:

```txt File Tree icon="folder-tree" theme={"theme":{"light":"github-light","dark":"dracula"}}
<root>
├── README.md
├── bun.lock
├── package.json
├── tsconfig.json
└── packages
    ├── pkg-a
    │   ├── index.ts
    │   ├── package.json
    │   └── tsconfig.json
    ├── pkg-b
    │   ├── index.ts
    │   ├── package.json
    │   └── tsconfig.json
    └── pkg-c
        ├── index.ts
        ├── package.json
        └── tsconfig.json
```

In the root `package.json`, the `"workspaces"` key is used to indicate which subdirectories should be considered packages/workspaces within the monorepo. It's conventional to place all the workspace in a directory called `packages`.

```json package.json icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
{
  "name": "my-project",
  "version": "1.0.0",
  "workspaces": ["packages/*"],
  "devDependencies": {
    "example-package-in-monorepo": "workspace:*"
  }
}
```

<Note>
  **Glob support** — Bun supports full glob syntax in `"workspaces"`, including negative patterns (e.g.
  `!**/excluded/**`). See [here](/runtime/glob#supported-glob-patterns) for a comprehensive list of supported syntax.
</Note>

```json package.json icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
{
  "name": "my-project",
  "version": "1.0.0",
  "workspaces": ["packages/**", "!packages/**/test/**", "!packages/**/template/**"]
}
```

Each workspace has it's own `package.json`. When referencing other packages in the monorepo, semver or workspace protocols (e.g. `workspace:*`) can be used as the version field in your `package.json`.

```json packages/pkg-a/package.json icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
{
  "name": "pkg-a",
  "version": "1.0.0",
  "dependencies": {
    "pkg-b": "workspace:*"
  }
}
```

`bun install` will install dependencies for all workspaces in the monorepo, de-duplicating packages if possible. If you only want to install dependencies for specific workspaces, you can use the `--filter` flag.

```bash theme={"theme":{"light":"github-light","dark":"dracula"}}
# Install dependencies for all workspaces starting with `pkg-` except for `pkg-c`
bun install --filter "pkg-*" --filter "!pkg-c"

# Paths can also be used. This is equivalent to the command above.
bun install --filter "./packages/pkg-*" --filter "!pkg-c" # or --filter "!./packages/pkg-c"
```

When publishing, `workspace:` versions are replaced by the package's `package.json` version,

```
"workspace:*" -> "1.0.1"
"workspace:^" -> "^1.0.1"
"workspace:~" -> "~1.0.1"
```

Setting a specific version takes precedence over the package's `package.json` version,

```
"workspace:1.0.2" -> "1.0.2" // Even if current version is 1.0.1
```

Workspaces have a couple major benefits.

* **Code can be split into logical parts.** If one package relies on another, add it as a dependency in `package.json`. If package `b` depends on `a`, `bun install` will install your local `packages/a` directory into `node_modules` instead of downloading it from the npm registry.
* **Dependencies can be de-duplicated.** If `a` and `b` share a common dependency, it will be *hoisted* to the root `node_modules` directory. This reduces redundant disk usage and minimizes "dependency hell" issues associated with having multiple versions of a package installed simultaneously.
* **Run scripts in multiple packages.** You can use the [`--filter` flag](/pm/filter) to run `package.json` scripts in multiple packages in your workspace, or `--workspaces` to run scripts across all workspaces.

## Share versions with Catalogs

When many packages need the same dependency versions, catalogs let you define
those versions once in the root `package.json` and reference them from your
workspaces using the `catalog:` protocol. Updating the catalog automatically
updates every package that references it. See
[Catalogs](/pm/catalogs) for details.

<Note>
  ⚡️ **Speed** — Installs are fast, even for big monorepos. Bun installs the [Remix](https://github.com/remix-run/remix) monorepo in about `500ms` on Linux.

  * 28x faster than `npm install`
  * 12x faster than `yarn install` (v1)
  * 8x faster than `pnpm install`

  <Image src="https://user-images.githubusercontent.com/709451/212829600-77df9544-7c9f-4d8d-a984-b2cd0fd2aa52.png" />
</Note>

# Catalogs

> Share common dependency versions across multiple packages in a monorepo

Catalogs in Bun let you share common dependency versions across multiple packages in a monorepo. Rather than specifying the same versions repeatedly in each workspace package, you define them once in the root package.json and reference them consistently throughout your project.

## Overview

Unlike traditional dependency management where each workspace package needs to independently specify versions, catalogs let you:

1. Define version catalogs in the root package.json
2. Reference these versions with the `catalog:` protocol
3. Update all packages simultaneously by changing the version in one place

This is especially useful in large monorepos where dozens of packages need to use the same version of key dependencies.

## How to Use Catalogs

### Directory Structure Example

Consider a monorepo with the following structure:

```
my-monorepo/
├── package.json
├── bun.lock
└── packages/
    ├── app/
    │   └── package.json
    ├── ui/
    │   └── package.json
    └── utils/
        └── package.json
```

### 1. Define Catalogs in Root package.json

In your root-level `package.json`, add a `catalog` or `catalogs` field within the `workspaces` object:

```json package.json icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
{
  "name": "my-monorepo",
  "workspaces": {
    "packages": ["packages/*"],
    "catalog": {
      "react": "^19.0.0",
      "react-dom": "^19.0.0"
    },
    "catalogs": {
      "testing": {
        "jest": "30.0.0",
        "testing-library": "14.0.0"
      }
    }
  }
}
```

If you put `catalog` or `catalogs` at the top level of the `package.json` file, that will work too.

### 2. Reference Catalog Versions in Workspace Packages

In your workspace packages, use the `catalog:` protocol to reference versions:

```json packages/app/package.json icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
{
  "name": "app",
  "dependencies": {
    "react": "catalog:",
    "react-dom": "catalog:",
    "jest": "catalog:testing"
  }
}
```

```json packages/ui/package.json icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
{
  "name": "ui",
  "dependencies": {
    "react": "catalog:",
    "react-dom": "catalog:"
  },
  "devDependencies": {
    "jest": "catalog:testing",
    "testing-library": "catalog:testing"
  }
}
```

### 3. Run Bun Install

Run `bun install` to install all dependencies according to the catalog versions.

## Catalog vs Catalogs

Bun supports two ways to define catalogs:

1. **`catalog`** (singular): A single default catalog for commonly used dependencies

   ```json package.json icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
   "catalog": {
     "react": "^19.0.0",
     "react-dom": "^19.0.0"
   }
   ```

   Reference with `catalog:`:

   ```json packages/app/package.json icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
   "dependencies": {
     "react": "catalog:"
   }
   ```

2. **`catalogs`** (plural): Multiple named catalogs for grouping dependencies

   ```json package.json icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
   "catalogs": {
     "testing": {
       "jest": "30.0.0"
     },
     "ui": {
       "tailwind": "4.0.0"
     }
   }
   ```

   Reference with `catalog:<name>`:

   ```json packages/app/package.json icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
   "dependencies": {
     "jest": "catalog:testing",
     "tailwind": "catalog:ui"
   }
   ```

## Benefits of Using Catalogs

* **Consistency**: Ensures all packages use the same version of critical dependencies
* **Maintenance**: Update a dependency version in one place instead of across multiple package.json files
* **Clarity**: Makes it obvious which dependencies are standardized across your monorepo
* **Simplicity**: No need for complex version resolution strategies or external tools

## Real-World Example

Here's a more comprehensive example for a React application:

**Root package.json**

```json package.json icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
{
  "name": "react-monorepo",
  "workspaces": {
    "packages": ["packages/*"],
    "catalog": {
      "react": "^19.0.0",
      "react-dom": "^19.0.0",
      "react-router-dom": "^6.15.0"
    },
    "catalogs": {
      "build": {
        "webpack": "5.88.2",
        "babel": "7.22.10"
      },
      "testing": {
        "jest": "29.6.2",
        "react-testing-library": "14.0.0"
      }
    }
  },
  "devDependencies": {
    "typescript": "5.1.6"
  }
}
```

```json packages/app/package.json icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
{
  "name": "app",
  "dependencies": {
    "react": "catalog:",
    "react-dom": "catalog:",
    "react-router-dom": "catalog:",
    "@monorepo/ui": "workspace:*",
    "@monorepo/utils": "workspace:*"
  },
  "devDependencies": {
    "webpack": "catalog:build",
    "babel": "catalog:build",
    "jest": "catalog:testing",
    "react-testing-library": "catalog:testing"
  }
}
```

```json packages/ui/package.json icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
{
  "name": "@monorepo/ui",
  "dependencies": {
    "react": "catalog:",
    "react-dom": "catalog:"
  },
  "devDependencies": {
    "jest": "catalog:testing",
    "react-testing-library": "catalog:testing"
  }
}
```

```json packages/utils/package.json icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
{
  "name": "@monorepo/utils",
  "dependencies": {
    "react": "catalog:"
  },
  "devDependencies": {
    "jest": "catalog:testing"
  }
}
```

## Updating Versions

To update versions across all packages, change the version in the root package.json:

```json package.json icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
"catalog": {
  "react": "^19.1.0",  // Updated from ^19.0.0
  "react-dom": "^19.1.0"  // Updated from ^19.0.0
}
```

Then run `bun install` to update all packages.

## Lockfile Integration

Bun's lockfile tracks catalog versions, ensuring consistent installations across different environments. The lockfile includes:

* The catalog definitions from your package.json
* The resolution of each cataloged dependency

```json bun.lock(excerpt) icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
{
  "lockfileVersion": 2,
  "workspaces": {
    "": {
      "name": "react-monorepo",
    },
    "packages/app": {
      "name": "app",
      "dependencies": {
        "react": "catalog:",
        "react-dom": "catalog:",
        ...
      },
    },
    ...
  },
  "catalog": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    ...
  },
  "catalogs": {
    "build": {
      "webpack": "5.88.2",
      ...
    },
    ...
  },
  "packages": {
    ...
  }
}
```

## Limitations and Edge Cases

* Catalog references must match a dependency defined in either `catalog` or one of the named `catalogs`
* Empty strings and whitespace in catalog names are ignored (treated as default catalog)
* Invalid dependency versions in catalogs will fail to resolve during `bun install`
* Catalogs are only available within workspaces; they cannot be used outside the monorepo

Bun's catalog system maintains consistency across your monorepo without introducing additional complexity to your workflow.

## Publishing

When you run `bun publish` or `bun pm pack`, Bun automatically replaces
`catalog:` references in your `package.json` with the resolved version numbers.
The published package includes regular semver strings and no longer depends on
your catalog definitions.

# bun link

> Link local packages for development

Use `bun link` in a local directory to register the current package as a "linkable" package.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
cd /path/to/cool-pkg
cat package.json
bun link
```

```txt theme={"theme":{"light":"github-light","dark":"dracula"}}
bun link v1.3.3 (7416672e)
Success! Registered "cool-pkg"

To use cool-pkg in a project, run:
  bun link cool-pkg

Or add it in dependencies in your package.json file:
  "cool-pkg": "link:cool-pkg"
```

This package can now be "linked" into other projects using `bun link cool-pkg`. This will create a symlink in the `node_modules` directory of the target project, pointing to the local directory.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
cd /path/to/my-app
bun link cool-pkg
```

In addition, the `--save` flag can be used to add `cool-pkg` to the `dependencies` field of your app's package.json with a special version specifier that tells Bun to load from the registered local directory instead of installing from `npm`:

```json package.json icon="file-json" theme={"theme":{"light":"github-light","dark":"dracula"}}
{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "cool-pkg": "link:cool-pkg" // [!code ++]
  }
}
```

## Unlinking

Use `bun unlink` in the root directory to unregister a local package.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
cd /path/to/cool-pkg
bun unlink
```

```txt theme={"theme":{"light":"github-light","dark":"dracula"}}
bun unlink v1.3.3 (7416672e)
```

***

# CLI Usage

```bash theme={"theme":{"light":"github-light","dark":"dracula"}}
bun link <packages>
```

### Installation Scope

<ParamField path="--global" type="boolean">
  Install globally. Alias: <code>-g</code>
</ParamField>

### Dependency Management

<ParamField path="--production" type="boolean">
  Don't install devDependencies. Alias: <code>-p</code>
</ParamField>

<ParamField path="--omit" type="string">
  Exclude <code>dev</code>, <code>optional</code>, or <code>peer</code> dependencies from install
</ParamField>

### Project Files & Lockfiles

<ParamField path="--yarn" type="boolean">
  Write a <code>yarn.lock</code> file (yarn v1). Alias: <code>-y</code>
</ParamField>

<ParamField path="--frozen-lockfile" type="boolean">
  Disallow changes to lockfile
</ParamField>

<ParamField path="--save-text-lockfile" type="boolean">
  Save a text-based lockfile
</ParamField>

<ParamField path="--lockfile-only" type="boolean">
  Generate a lockfile without installing dependencies
</ParamField>

<ParamField path="--no-save" type="boolean">
  Don't update <code>package.json</code> or save a lockfile
</ParamField>

<ParamField path="--save" type="boolean" default="true">
  Save to <code>package.json</code> (true by default)
</ParamField>

<ParamField path="--trust" type="boolean">
  Add to <code>trustedDependencies</code> in the project's <code>package.json</code> and install the package(s)
</ParamField>

### Installation Control

<ParamField path="--force" type="boolean">
  Always request the latest versions from the registry & reinstall all dependencies. Alias: <code>-f</code>
</ParamField>

<ParamField path="--no-verify" type="boolean">
  Skip verifying integrity of newly downloaded packages
</ParamField>

<ParamField path="--backend" type="string" default="clonefile">
  Platform-specific optimizations for installing dependencies. Possible values: <code>clonefile</code> (default),{" "}
  <code>hardlink</code>, <code>symlink</code>, <code>copyfile</code>
</ParamField>

<ParamField path="--linker" type="string">
  Linker strategy (one of <code>isolated</code> or <code>hoisted</code>)
</ParamField>

<ParamField path="--dry-run" type="boolean">
  Don't install anything
</ParamField>

<ParamField path="--ignore-scripts" type="boolean">
  Skip lifecycle scripts in the project's <code>package.json</code> (dependency scripts are never run)
</ParamField>

### Network & Registry

<ParamField path="--ca" type="string">
  Provide a Certificate Authority signing certificate
</ParamField>

<ParamField path="--cafile" type="string">
  Same as <code>--ca</code>, but as a file path to the certificate
</ParamField>

<ParamField path="--registry" type="string">
  Use a specific registry by default, overriding <code>.npmrc</code>, <code>bunfig.toml</code>, and environment
  variables
</ParamField>

<ParamField path="--network-concurrency" type="number" default="48">
  Maximum number of concurrent network requests (default 48)
</ParamField>

### Performance & Resource

<ParamField path="--concurrent-scripts" type="number" default="5">
  Maximum number of concurrent jobs for lifecycle scripts (default 5)
</ParamField>

### Caching

<ParamField path="--cache-dir" type="string">
  Store & load cached data from a specific directory path
</ParamField>

<ParamField path="--no-cache" type="boolean">
  Ignore manifest cache entirely
</ParamField>

### Output & Logging

<ParamField path="--silent" type="boolean">
  Don't log anything
</ParamField>

<ParamField path="--quiet" type="boolean">
  Only show tarball name when packing
</ParamField>

<ParamField path="--verbose" type="boolean">
  Excessively verbose logging
</ParamField>

<ParamField path="--no-progress" type="boolean">
  Disable the progress bar
</ParamField>

<ParamField path="--no-summary" type="boolean">
  Don't print a summary
</ParamField>

### Platform Targeting

<ParamField path="--cpu" type="string">
  Override CPU architecture for optional dependencies (e.g., <code>x64</code>, <code>arm64</code>, <code>\*</code> for
  all)
</ParamField>

<ParamField path="--os" type="string">
  Override operating system for optional dependencies (e.g., <code>linux</code>, <code>darwin</code>, <code>\*</code> for
  all)
</ParamField>

### Global Configuration & Context

<ParamField path="--config" type="string">
  Specify path to config file (<code>bunfig.toml</code>). Alias: <code>-c</code>
</ParamField>

<ParamField path="--cwd" type="string">
  Set a specific current working directory
</ParamField>

### Help

<ParamField path="--help" type="boolean">
  Print this help menu. Alias: <code>-h</code>
</ParamField>

# bun pm

> Package manager utilities

The `bun pm` command group provides a set of utilities for working with Bun's package manager.

## pack

To create a tarball of the current workspace:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun pm pack
```

This command creates a `.tgz` file containing all files that would be published to npm, following the same rules as `npm pack`.

## Examples

Basic usage:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun pm pack
# Creates my-package-1.0.0.tgz in current directory
```

Quiet mode for scripting:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
TARBALL=$(bun pm pack --quiet)
echo "Created: $TARBALL"
```

```txt theme={"theme":{"light":"github-light","dark":"dracula"}}
Created: my-package-1.0.0.tgz
```

Custom destination:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun pm pack --destination ./dist
# Saves tarball in ./dist/ directory
```

## Options

* `--dry-run`: Perform all tasks except writing the tarball to disk. Shows what would be included.
* `--destination <dir>`: Specify the directory where the tarball will be saved.
* `--filename <name>`: Specify an exact file name for the tarball to be saved at.
* `--ignore-scripts`: Skip running pre/postpack and prepare scripts.
* `--gzip-level <0-9>`: Set a custom compression level for gzip, ranging from 0 to 9 (default is 9).
* `--quiet`: Only output the tarball filename, suppressing verbose output. Ideal for scripts and automation.

> **Note:** `--filename` and `--destination` cannot be used at the same time.

## Output Modes

**Default output:**

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun pm pack
```

```txt theme={"theme":{"light":"github-light","dark":"dracula"}}
bun pack v1.2.19

packed 131B package.json
packed 40B index.js

my-package-1.0.0.tgz

Total files: 2
Shasum: f2451d6eb1e818f500a791d9aace80b394258a90
Unpacked size: 171B
Packed size: 249B
```

**Quiet output:**

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun pm pack --quiet
```

```txt theme={"theme":{"light":"github-light","dark":"dracula"}}
my-package-1.0.0.tgz
```

The `--quiet` flag is particularly useful for automation workflows where you need to capture the generated tarball filename for further processing.

## bin

To print the path to the `bin` directory for the local project:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun pm bin
```

```txt theme={"theme":{"light":"github-light","dark":"dracula"}}
/path/to/current/project/node_modules/.bin
```

To print the path to the global `bin` directory:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun pm bin -g
```

```txt theme={"theme":{"light":"github-light","dark":"dracula"}}
<$HOME>/.bun/bin
```

## ls

To print a list of installed dependencies in the current project and their resolved versions, excluding their dependencies.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun pm ls
# or
bun list
```

```txt theme={"theme":{"light":"github-light","dark":"dracula"}}
/path/to/project node_modules (135)
├── eslint@8.38.0
├── react@18.2.0
├── react-dom@18.2.0
├── typescript@5.0.4
└── zod@3.21.4
```

To print all installed dependencies, including nth-order dependencies.

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun pm ls --all
# or
bun list --all
```

```txt theme={"theme":{"light":"github-light","dark":"dracula"}}
/path/to/project node_modules (135)
├── @eslint-community/eslint-utils@4.4.0
├── @eslint-community/regexpp@4.5.0
├── @eslint/eslintrc@2.0.2
├── @eslint/js@8.38.0
├── @nodelib/fs.scandir@2.1.5
├── @nodelib/fs.stat@2.0.5
├── @nodelib/fs.walk@1.2.8
├── acorn@8.8.2
├── acorn-jsx@5.3.2
├── ajv@6.12.6
├── ansi-regex@5.0.1
├── ...
```

## whoami

Print your npm username. Requires you to be logged in (`bunx npm login`) with credentials in either `bunfig.toml` or `.npmrc`:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun pm whoami
```

## hash

To generate and print the hash of the current lockfile:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun pm hash
```

To print the string used to hash the lockfile:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun pm hash-string
```

To print the hash stored in the current lockfile:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun pm hash-print
```

## cache

To print the path to Bun's global module cache:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun pm cache
```

To clear Bun's global module cache:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun pm cache rm
```

## migrate

To migrate another package manager's lockfile without installing anything:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun pm migrate
```

## untrusted

To print current untrusted dependencies with scripts:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun pm untrusted
```

```txt theme={"theme":{"light":"github-light","dark":"dracula"}}
./node_modules/@biomejs/biome @1.8.3
 » [postinstall]: node scripts/postinstall.js

These dependencies had their lifecycle scripts blocked during install.
```

## trust

To run scripts for untrusted dependencies and add to `trustedDependencies`:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun pm trust <names>
```

Options for the `trust` command:

* `--all`: Trust all untrusted dependencies.

## default-trusted

To print the default trusted dependencies list:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun pm default-trusted
```

see the current list on GitHub [here](https://github.com/oven-sh/bun/blob/main/src/install/default-trusted-dependencies.txt)

## version

To display current package version and help:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun pm version
```

```txt theme={"theme":{"light":"github-light","dark":"dracula"}}
bun pm version v1.3.3 (ca7428e9)
Current package version: v1.0.0

Increment:
  patch      1.0.0 → 1.0.1
  minor      1.0.0 → 1.1.0
  major      1.0.0 → 2.0.0
  prerelease 1.0.0 → 1.0.1-0
  prepatch   1.0.0 → 1.0.1-0
  preminor   1.0.0 → 1.1.0-0
  premajor   1.0.0 → 2.0.0-0
  from-git   Use version from latest git tag
  1.2.3      Set specific version

Options:
  --no-git-tag-version Skip git operations
  --allow-same-version Prevents throwing error if version is the same
  --message=<val>, -m  Custom commit message, use %s for version substitution
  --preid=<val>        Prerelease identifier (i.e beta → 1.0.1-beta.0)
  --force, -f          Bypass dirty git history check

Examples:
  bun pm version patch
  bun pm version 1.2.3 --no-git-tag-version
  bun pm version prerelease --preid beta --message "Release beta: %s"
```

To bump the version in `package.json`:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
bun pm version patch
```

```txt theme={"theme":{"light":"github-light","dark":"dracula"}}
v1.0.1
```

Supports `patch`, `minor`, `major`, `premajor`, `preminor`, `prepatch`, `prerelease`, `from-git`, or specific versions like `1.2.3`. By default creates git commit and tag unless `--no-git-tag-version` was used to skip.

## pkg

Manage `package.json` data with get, set, delete, and fix operations.

All commands support dot and bracket notation:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
scripts.build              # dot notation
contributors[0]            # array access
workspaces.0               # dot with numeric index
scripts[test:watch]        # bracket for special chars
```

Examples:

```bash terminal icon="terminal" theme={"theme":{"light":"github-light","dark":"dracula"}}
# get
bun pm pkg get name                               # single property
bun pm pkg get name version                       # multiple properties
bun pm pkg get                                    # entire package.json
bun pm pkg get scripts.build                      # nested property

# set
bun pm pkg set name="my-package"                  # simple property
bun pm pkg set scripts.test="jest" version=2.0.0  # multiple properties
bun pm pkg set {"private":"true"} --json          # JSON values with --json flag

# delete
bun pm pkg delete description                     # single property
bun pm pkg delete scripts.test contributors[0]    # multiple/nested

# fix
bun pm pkg fix                                    # auto-fix common issues
```
