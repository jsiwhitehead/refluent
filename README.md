# Refluent

Refluent is a powerful and expressive fluent API for building React components, without the need for classes, state, lifecycle methods, shouldComponentUpdate, or higher order components.

## Installation

```
yarn add refluent
```

## Table of contents

- [Overview](#overview)
  - [Example](#example)
  - [Motivation: beyond higher-order components](#motivation-beyond-higher-order-components)
- [Method 1: `do: (props => props)`](#method-1-do-props--props)
  - [Basic form](#basic-form)
  - [Advanced form](#advanced-form)
  - Further details
    - [Caching](#caching)
    - [Memoization](#memoization)
    - [Re-selecting pushed props](#re-selecting-pushed-props)
    - [Side effects](#side-effects)
- [Method 2: `yield (props => dom)`](#method-2-yield-props--dom)
  - Further details
    - [Default yield](#default-yield)
    - [Refactoring and composition](#refactoring-and-composition)
- [Method 3: `transform (component => component)`](#method-3-transform-component--component)
- [Utility: `branch`](#utility-branch)
- [Full example](#full-example)

## Overview

Refluent lets you build up React components from multiple smaller steps, working with the flow of props (starting with those provided to your component) and either:

1.  Selecting props and using them to generate additional ones to pass forward (`props => props`) or
2.  Using the incoming props to output dom (`props => dom`)

The result at every step is a functional React component, extended with three methods `do`, `yield` (corresponding to 1 and 2 above) and `transform`, which themselves return new functional components extended in the same way.

This changes the conceptual model of a component from a single object which accepts props, manages some state (optionally), and renders a single piece of dom, to a 'mini-program' which accepts initial props, applies transformations to them, and outputs dom at various points along the way.

### Example

To demonstrate, here we create a simple `ShortInput` component of a text field, with optional label and initial value, that changes color from black to red if the value goes above 100 characters. Note how props are selected and used to create new ones in steps 2 and 3, and how dom is 'yielded' in steps 1 and 4.

```javascript
import * as React from 'react';
import r from 'refluent';

const ShortInput = r

  // Step 1
  .yield(({ label = '', next }) => (
    <div>
      {label} {next()}
    </div>
  ))

  // Step 2
  .do('initial', (initial = '', push) => ({
    value: initial,
    onChange: value => push({ value }),
  }))

  // Step 3
  .do('value', value => ({
    color: value.length > 100 ? 'red' : 'black',
  }))

  // Step 4
  .yield(({ value, onChange, color }) => (
    <input type="text" value={value} onChange={onChange} style={{ color }} />
  ));
```

### Motivation: beyond higher-order components

After using React for a number of years I found myself regularly using [Recompose](https://github.com/acdlite/recompose) to write long components in the form `compose(hoc1, hoc2, ...)`. Additionally, although HOCs are formally of the shape `(props => dom) => (props => dom)`, I noticed most of the HOCs I was using were more like `props => props (=> dom)`. Together with discovering the `mapPropsStream` HOC (also from Recompose), this helped me to see components as transformations of a flow of props, along with dom output (i.e. `props1 => props2 => props3 => ... => dom`).

From there, I felt the wide variety of HOCs in Recompose weren't helping express this clearly, and worked to combine `withProps`, `withHandlers`, `mapPropsStream` and `pure` into a single 'prop transformation' HOC, `do`. At the same time, `renderComponent`, `nest`, and the emergence of [render props](https://reactjs.org/docs/render-props.html) together led to the idea of a 'partial dom output' HOC, `yield`.

Finally, after successfully rewriting the majority of my components using only these two HOCs (and `compose`), I realised I could attach them directly onto a functional component and create the fluent API system of Refluent, and hence remove the need for HOCs altogether, fully capturing the sense of components as a single flow of props and dom output.

## Method 1: `do: (props => props)`

The `do` method transforms the flow of props, by selecting (similar to [Reselect](https://github.com/reduxjs/reselect)) from the incoming props, and using these to generate additional ones (or changes to existing ones) to pass forward. There are two forms / overloads.

The generation of new props can be either:

- **Sync:** new props are effectively derived properties of the incoming props
- **Async:** new props are set / updated in response to events, data fetching etc

### Basic form

The basic form accepts a number of selectors, along with a map which generates the new props, called whenever the selected values change.

```typescript
do(
  selector1,
  selector2,
  ...
  map: (value1, value2, ..., push, isCommit) => result
)
```

#### `selector: number | string | (props, pushedProps) => value`

Numeric or string value treated as a prop key (optionally nested like `a.b`), or an arbitrary selector map.

#### `map: (value1, value2, ..., push, isCommit) => result`

The body of the `do` method, called whenever the selected values change.

#### `push: (props, callback?) => void`

Call to 'push' new props forward. The resulting props from `do` are the incoming props merged together with all the pushed props (in order if `push` is called multiple times). To clear an incoming prop, push an update to it of `undefined`.

If provided, `callback` will be called when the component has updated with the new props.

#### `isCommit: boolean`

True if `map` was called from the 'commit' phase (see [React async rendering](https://reactjs.org/blog/2018/03/27/update-on-async-rendering.html)). This is useful as some actions, such as data fetching, are only suitable during the 'commit' phase.

#### `result: object | () => {} | void`

Either `void` or:

- **An object:** treated as props to push forward, exactly as if `push` had been called
- **A function:** called immediately before `map` is next called, or when the component is unmounted (use to clean up any side effects)

### Advanced form

The advanced form is similar, but in a sense one 'layer up' - instead of passing the selectors and map directly, you pass a function which uses the provided `props$` argument to do so.

The key benefit of this form is that you gain access to a function closure around the selectors and maps.

```typescript
do(
  func: (
    props$:
      | (
        selector1,
        selector2,
        ...
        map: (value1, value2, ..., isCommit) => result
      )
      | (getPushed?) => props,
    push,
    isCommit
  ) => result
)
```

#### `func`

Called when the component is initiated.

Like `map`, the result of `func` is either `void` or:

- **An object:** treated as props to push forward, exactly as if `push` had been called
- **A function:** called when the component is unmounted

#### `props$`

The first overload is exactly equivalent to calling the basic form of `do`, except that `push` isn't passed to `map` since it's already available from the arguments of `func`. If this is used at all, it must be done synchronously within `func`.

The second overload allows direct access to both the incoming and pushed props (pass `getPushed = true` for the latter). This will error if called directly from a `map`, you must use selectors instead to access props there.

**Note:** For optimization purposes, the second overload is only available if `func` is also called with `push`. If you need it, but don't need `push`, just write `.do((props$, _) => ...)`.

### Further details

#### Caching

Every `do` maintains a cache of all previously pushed props, which newly pushed ones are compared against and replaced with if they are equivalent by value (for dates, JSON etc). In addition, all pushed props which are functions are wrapped in a static 'caller' function. The initial props of any Refluent component are also cached in the same way.

This means props change as little as possible, and can be compared for equality by reference rather than by value during memoization (see below).

**Note:** If a function prop is going to be called immediately during a `do` or `yield` call (e.g. a render prop), then give it a key of `noCache: true` to avoid being wrapped, otherwise your component wont re-render when it changes.

#### Memoization

The reason `do` uses selectors and only allows for merging new props, rather than just accepting an arbitrary map `props => props`, is so that `map` can be memoized.

Due to caching (see above), the selected values can be compared to their previous values by reference, and `map` is only called when one or more values have changed.

This means you never have to worry about pure components or `shouldComponentUpdate`, as updates only happen when they need to.

#### Re-selecting pushed props

As you may have spotted, selectors have access to the pushed props from the `do` call they are in. This is useful in various circumstances, but naturally creates a potential circular reference - pushed values can be selected and then used to update the same pushed values.

Fortunately, due to memoization and caching this will generally be fine as long as the intent of your `map` makes sense, i.e. if any circular references quickly converge to a static value.

#### Side effects

To allow effective memoization, and to work with React async rendering, Refluent needs to carefully control side effects. Specifically, if a `map` is called from `do`, it either needs to be side effect free, or it needs to return a function which cleans up any active side effects.

**Note:** Don't make any assumptions of when `map` will be called, it will likely be very different to what you expect, due to both memoization and async rendering.

## Method 2: `yield (props => dom)`

Conceptually, the `yield` method uses the incoming props to output dom, just like a functional React component.

In reality, `yield` accepts any React component (i.e. also standard React class components), which it calls with the incoming props, combined with a special render prop called `next` (as long as one of `do` or `yield` is called again after this `yield`), which is used to continue the component.

```typescript
yield(
  component: Component<{
    ...props,
    next:
      | () => dom
      | (nextProps | props => nextProps, doCache?) => dom,
  }>
)
```

#### `next`

Calling `next` renders the continuation of the component (i.e. further `do` and `yield` calls) at that location within the rendered dom.

The arguments for `next` control which props are sent forward, and whether they are cached first. If no props are provided the previous ones are used, otherwise new ones are provided (directly or as a map of the previous props), and are optionally cached (set `doCache = true`).

### Further details

#### Default yield

Intuitively, every component must end with a `yield`, otherwise you have transformed props with a `do` but aren't doing anything with them.

Hence, if the last method called on your component isn't a `yield`, a default one is applied automatically, which does the following:

```typescript
r
  ...
  .yield({ next, children, ...props }) => {
    if (next) return next({ ...props, children });
    if (typeof children === 'function') return children(props);
    return children || null;
  })
```

I.e. `next` is used if present (important for composition, see below), then `children` (called if a function), or finally just `null`.

#### Refactoring and composition

As `yield` accepts any component, this can be used for composition. In particular, with the help of the default `yield`, the following are equivalent:

```typescript
r
  .a(...)
  .b(...)
  ...
```

```typescript
r
  .yield(
    r
      .a(...)
      .b(...)
      ...
  )
```

I.e. **any chain of steps in a Refluent component can be refactored out into a new component**, and called with yield, with the exact same effect.

## Method 3: `transform (component => component)`

Using Refluent removes the need for higher-order components, but for compatability with other libraries the `transform` helper method is provided.

```typescript
transform(
  hoc: (component: Component) => Component
)
```

## Utility: `branch`

Alongside with the main API, Refluent also comes with a helper utility called `branch`.

```typescript
branch(
  test: selector,
  truthy: Component,
  falsy?: Component
) => Component
```

This creates a component which applies the `test` selector (equivalent to selectors in `do`) to the incoming props to choose which of `truthy` or `falsy` to render. If the value is falsy and `falsy` isn't provided, the default `yield` component is used.

Together with `yield`, this allows Refluent components to express (potentially nested) branching if/else logic.

## Full example

Here we create a more complex `Input` component of a text field, with optional initial label and hoverable submit button, which will only call submit (on clicking the button or hitting enter) if the value is below 100 characters.

```typescript
import r, { branch } from 'refluent';

const watchHover = r.do(
  'onMouseMove',
  'onMouseLeave',
  (onMouseMove, onMouseLeave, push) => ({
    hoverProps: {
      onMouseMove: () => push({ isHovered: true }),
      onMouseLeave: () => push({ isHovered: false }),
    },
    isHovered: false,
  }),
);

const Input = r
  .do('initial', (initial = '', push) => ({
    value: initial,
    onChange: value => push({ value }),
  }))
  .do((props$, push) => ({
    submit: () => {
      if (props$().value.length < 100) props$().submit();
    },
  }))
  .yield(
    branch(
      ({ withButton }) => withButton,
      r
        .yield(watchHover)
        .do('isHovered', isHovered => ({
          background: isHovered ? 'red' : 'orange',
        }))
        .yield(({ submit, hoverProps, background, next }) => (
          <div>
            {next()}
            <p onClick={submit} {...hoverProps} style={{ background }}>
              Submit
            </p>
          </div>
        )),
    ),
  )
  .do('submit', submit => ({
    onKeyDown: e => {
      if (e.keyCode === 13) submit();
    },
  }))
  .yield(({ value, onChange, onKeyDown }) => (
    <input
      type="text"
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
    />
  ));
```
