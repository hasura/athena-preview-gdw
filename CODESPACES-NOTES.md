# Git LFS

To pull the `graphql-engine` binary so that you can run it in Codespaces, you must run:

```sh
$ git lfs install
$ git lfs pull
```

```sh
@GavinRay97 ➜ /workspaces/athena-preview-gdw (master ✗) $ git lfs install
Updated git hooks.
Git LFS initialized.
@GavinRay97 ➜ /workspaces/athena-preview-gdw (master ✗) $ git lfs pull
```

# Building the Java binary with GraalVM

The minimum Codespaces instance that can compile this is the one with 16GB RAM.
Any smaller will fail with error code 137: Out-of-Memory
