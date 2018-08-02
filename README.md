# Refluent

Refluent is an alternative chainable ([fluent](https://en.wikipedia.org/wiki/Fluent_interface)) API for React components, which lets you express a component as a flow of transformed props (`do`), gradually outputting dom (`yield`).

Chained together, these methods allow for creating complex, efficient components without the need for classes, state, lifecycle methods, or shouldComponentUpdate.

In addition, components built with Refluent are inherently composable, removing the need for the further abstraction of higher-order components.

```
yarn add refluent
```

### Example

To demonstrate, here we create a component which renders a text field, with optional label and initial value, that changes color from black to red if the value goes above 100 characters:

```javascript
import * as React from 'react';
import r from 'refluent';

const InputBase = r

  // Create a value prop (with optional initial value) and onChange handler
  .do('initial', (initial = null, push) => ({
    value: initial,
    onChange: value => push({ value }),
  }));

const ShortInput = r

  // Step 1: Compose with InputBase to get the value and onChange props
  .yield(InputBase)

  // Step 2: Render the optional label and call next to continue the component
  .yield(({ label = '', next }) => (
    <div>
      {label} {next()}
    </div>
  ))

  // Step 3: Set the input color depending on the current value length
  .do('value', value => ({
    color: value.length > 100 ? 'red' : 'black',
  }))

  // Step 4: Render the input element
  .yield(({ value, onChange, color }) => (
    <input type="text" value={value} onChange={onChange} style={{ color }} />
  ));
```

## Table of contents

- [Method 1: `do: (props => props)`](#method-1-do-props--props)
  - [Basic form](#basic-form)
  - [Advanced form](#advanced-form)
  - [Caching](#caching)
  - [Memoization](#memoization)
  - [Re-selecting pushed props](#re-selecting-pushed-props)
  - [Side effects](#side-effects)
- [Method 2: `yield (props => dom)`](#method-2-yield-props--dom)
  - [Default yield](#default-yield)
  - [Refactoring and composition](#refactoring-and-composition)
- [Method 3: `transform (component => component)`](#method-3-transform-component--component)
- [Utility: `branch`](#utility-branch)
- [Full example](#full-example)
- [Motivation: Beyond higher-order components](#motivation-beyond-higher-order-components)

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

### Caching

Every `do` maintains a cache of all previously pushed props, which newly pushed ones are compared against and replaced with if they are equivalent by value (for dates, JSON etc). In addition, all pushed props which are functions are wrapped in a static 'caller' function. The initial props of any Refluent component are also cached in the same way.

This means props change as little as possible, and can be compared for equality by reference rather than by value during memoization (see below).

**Note:** If a function prop is going to be called immediately during a `do` or `yield` call (e.g. a render prop), then give it a key of `noCache: true` to avoid being wrapped, otherwise your component wont re-render when it changes.

### Memoization

The reason `do` uses selectors and only allows for merging new props, rather than just accepting an arbitrary map `props => props`, is so that `map` can be memoized.

Due to caching (see above), the selected values can be compared to their previous values by reference, and `map` is only called when one or more values have changed.

This means you never have to worry about pure components or `shouldComponentUpdate`, as updates only happen when they need to.

### Re-selecting pushed props

Selectors have access to the pushed props from the `do` call they are in. This is useful in various circumstances, but naturally creates a potential circular reference - pushed values can be selected and then used to update the same pushed values.

Fortunately, due to memoization and caching this will generally be fine as long as the intent of your `map` makes sense, i.e. if any circular references quickly converge to a static value.

### Side effects

To allow effective memoization, and to work with React async rendering, Refluent needs to carefully control side effects. Specifically, if a `map` is called from `do`, it either needs to be side effect free, or it needs to return a function which cleans up any active side effects.

**Note:** Don't make any assumptions of when `map` will be called, it will likely be different to what you expect, due to both memoization and async rendering.

## Method 2: `yield (props => dom)`

Conceptually, the `yield` method uses the incoming props to output dom, just like a functional React component.

In reality, `yield` accepts any React component (i.e. also standard React class components), which it calls with the incoming props, combined with a special render prop called `next` (as long as another method is chained after this `yield`), which is used to continue the component.

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

Calling `next` renders the continuation of the component (i.e. further `do`, `yield` and `transform` calls) at that location within the rendered dom.

The arguments for `next` control which props are sent forward, and whether they are cached first. If no props are provided the previous ones are used, otherwise new ones are provided (directly or as a map of the previous props), and are optionally cached (set `doCache = true`).

### Default yield

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

I.e. `next` is used if present (important for composition, see below), then `children` (called if a render prop), or finally just `null`.

### Refactoring and composition

As `yield` accepts any component, this can be used for composition. Specifically, with the help of the default `yield`, the following are equivalent:

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

I.e. any chain of steps in a Refluent component can be refactored out into a new component, and called with yield, with the exact same effect.

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

This creates a component which applies the `test` selector (equivalent to selectors in `do`) to the incoming props to choose which of `truthy` or `falsy` to render. If the selected value is falsy and `falsy` isn't provided, the default `yield` component is used.

Together with `yield`, this allows Refluent components to express (potentially nested) branching if/else logic.

## Full example

Here we create a component which renders a text field, with optional initial label and hoverable submit button, which will only call submit (on clicking the button or hitting enter) if the value is below 100 characters.

```typescript
import r, { branch } from 'refluent';

const WatchHover = r.do(
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

const ShortInput = r
  .do(props$ => {
    let initialized = false;
    props$('initial', (initial = '') => {
      if (!initialized) {
        initialized = true;
        return { value: initial };
      }
    });
  })
  .do((props$, push) => ({
    onChange: value => push({ value }),
    submit: () => {
      if (props$().value.length < 100) props$().submit();
    },
  }))
  .yield(
    branch(
      ({ withButton }) => withButton,
      r
        .yield(WatchHover)
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

## Motivation: Beyond higher-order components

All the core ideas of Refluent are inspired by various parts of [Recompose](https://github.com/acdlite/recompose):

| Recompose                                                                                                                                                                      | Refluent                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| Composing together multiple 'prop transformation' HOCs, e.g. `compose(withProps, mapProps, withState, etc...)`, and using `mapPropsStream`                                     | Seeing components as a flow of transformed props           |
| Using `mapPropsStream` instead of class components, with the function closure for the class body, stream observation for lifecycle events, and stream combination for setState | Class components not required, even for advanced behaviour |
| Creating function props with `withHandlers` instead of `withProps` to maintain referential equality                                                                            | Automatic referential equality for function props          |
| Outputting dom with the `renderComponent` HOC and using `nest` to combine components (as well as the emergence of [render props](https://reactjs.org/docs/render-props.html))  | Partial / nested dom output                                |
| The HOC `mapProps` is a map `(propsA => dom) => (propsB => dom)`, but actually acts like `propsA => propsB (=> dom)`                                                           | Some HOCs don't conceptually map one component to another  |

After many experiments and iterations, the first four ideas led to a single pair of HOCs (`do` and `yield`) which could `compose` together to create almost any React component. This very small 'API', along with the last idea above, then inspired the trick of directly attaching the HOCs onto a functional component, creating the chainable API of Refluent and removing the need for explicit HOCs altogether.
