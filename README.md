# `docts`

**D**igital**O**cean **C**li **T**ypescript **S**erverless (`docts`) is a
community-led CLI library which enhances the development experience of
DigitalOcean [doctl serverless](https://docs.digitalocean.com/reference/doctl/)
when working with **Typescript** function projects.

## Introduction

[Serverless](https://en.wikipedia.org/wiki/Serverless_computing) is awesome. The
ability to deploy app without worrying about server management and scaling is a
massive relief for individuals and small teams.

With serverless, we get the following benefits:

- No server provisioning, configuration or maintenance
- No constant monthly cost regardless of usage
- No scaling issues during increased traffic
- Ability to focus almost completely on business logic

We've seen serverless from other cloud providers:

- **Google Cloud Platform** Cloud run
- **Amazon Web Services** Lambda
- **Azure** Serverless
- and now [DigitalOcean
  **Functions**](https://www.digitalocean.com/products/functions)

[`doctl`](https://docs.digitalocean.com/reference/doctl/) is the command-line
tool used to interact with DigitalOcean's APIs including serverless, but after
using it for a while, I find it ... _somewhat lacking_.

## Issues with `doctl serverless function`

When working with **Typescript**, there is a transpilation step to Javascript
which other supported languages don't have and aside initializing the Typescript
project, the `doctl serverless function` interface does not do much locally.

The transpilation of TS to JS makes things a bit tricky for working with
Typescript projects. Here's three of the major issues (in my opinion) I've
identified:

1. When you add new functions to your serverless project, you need to manually
   add a `function` entry your `project.yml`.

2. `doctl` sets up Typescript projects, treating each function as independent
   projects with `package.json` files.

   This approach keep functions independent, however in a project with multiple
   functions which use the same libraries, you have to manage these dependencies
   independently across all functions.

   You can see how this compounds as the number of functions in your serverless
   project grows.

3. The nature of the setup means, each function folder must be opened as
   a separate folder in your IDE else dependencies will be installed in the
   project's `package.json` instead of the function's `package.json`

## Project Goals

Owing to the above issues, `docts` CLI has the following objectives:

1. [x] Create a **Typescript** serverless project with a modified file structure
2. [x] Add/Remove functions to/from your serverless project and automatically
   update the `project.yml`.
3. [x] Install dependencies in the project root instead of function roots
4. [x] In the build step, traverse through each function's `import` statements,
   building a dependency graph. From this graph, automatically pick out the
   function's dependencies and save in the function's `package.json`
5. [x] Build `packages` from `src` and generate `package.json` with correct
   dependencies for each package

## Installation

Install the latest version of `docts` globally by running the following command
in your terminal.

```bash
yarn global add docts-cli
```

## CLI Usage

Here's the various features that `docts` provides

### 1. Initialize Serverless Project

```bash
docts init <project name>
```

To start a new Digital serverless, run the command above. You'll be asked for
the **project description**, **name of author** and **version number**.

`docts` uses this information to create the project directory and copy the
template files.

### 2. Create New Serverless Function

```bash
docts fn new <function name>
```

When you want to add a new serverless function to your project, run the command
above. The **function name** must be of the
format `<package name>/<function name>`.

As an example, to create a function called `create` in package `todo`, you'd
run `docts fn new todo/create`.

> `docts` automatically updates your `project.yml` with the function entry

### 3. Remove Serverless Function

```bash
docts fn remove <function name>
```

To remove a new serverless function to your project, run the command above. You
can either remove a single function or an entire package and all its functions.

As an example, for a project structure shown below,
running `docts fn remove todo/list` would delete the `src/todo/list` folder.

However, running `docts fn remove todo` would delete the `src/todo` folder.

```
| src
   | todo
      | create
         - index.ts
      | list
         - index.ts
```

> `docts` automatically updates your `project.yml`, removing the function or
> package entry

### 4. Scan Serverless Project

```bash
docts scan
```

Scans the `src/` directory and prints out a map of packages and functions.

### 5. Build Serverless Project

```bash
docts build
```

Builds the `packages/` directory from `src/` which can be deployed
to [DigitalOcean's App Platform](https://www.digitalocean.com/products/app-platform)
app or a [Function Namespace](https://www.digitalocean.com/products/functions)
via [doctl](https://docs.digitalocean.com/reference/doctl/).

## Build Process

After probing the inner workings of functions and extensive documentation
reading, I discovered the constraints that a serverless project needs to meet in
order to be deployable on App Platform.

- Each function folder under `packages/` must have all its import dependencies
  withing itself.

  > If a function file imports a module outside the function folder in `src/`,
  > our build process must include all dependencies in the final folder
  > under `packages/`

- The function folder can contain a single file which exports a name `main()`
  function. If the folder has multiple files, or has dependencies, it must
  a `package.json` indicating the main file as well as dependencies.

Now that we know this, we can begin constructing our build process. Let's see
what we need to do here:

- We need some kind of bundling, so we can merge function files and import
  dependencies into a single file
- We need to determine the `node_modules` imports and
- We need to generate each function's `package.json` which contains the entry
  file and its dependencies

After shopping around, the module bundler I settled on
was [Rollup](https://rollupjs.org/). It's fast, lightweight and has a powerful
JS API which handles all our needs.

With all this information and tools, let's see how `docts` builds your project:

1. Delete the `packages/` directory
2. Scan the project to find package and function declarations
3. For each declared function, determine the path to the `index.ts` in `src/`
4. Use Rollup
   to [build a module graph](https://rollupjs.org/guide/en/#rolluprollup)
   starting from the `index.ts`
5. Use Rollup to generate the bundle code and resolve `node_modules/`
   imports
6. Write the bundle code to the corresponding file under `packages/`
7. Lookup the `node_modules/` imports in the root `package.json` to get
   their versions
8. Write the dependencies to the function's `package.json` under `packages/`

And we are done! At this point we have an App Platform compatible `packages/`
directory that can be deployed.

## Testing

The `test/` folder contains the unit tests for each CLI functions. The tests are
written with [Mocha](https://mochajs.org/) and [Chai](https://www.chaijs.com/)
Clone the project and run them using the following command:

```bash
yarn test
```

## Roadmap

I created this project to improve the development experience for myself and
other devs in the DigitalOcean community. I believe we can collectively improve
and extend the project features.

### Serverless Offline Testing

The next major feature is to include a way of testing functions offline before
deployment. Any and all contributions from the community are greatly welcome.

## Contributors

- [Kwame Opare Asiedu](https://github.com/kwameopareasiedu)