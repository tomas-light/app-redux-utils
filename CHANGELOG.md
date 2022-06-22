# Changelog

### 1.7.2:
* move `cheap-di` to peerDependencies

### 1.7.1:
* Breaking changes:
  * remove `createReducers` function, because of deprecation;

### 1.7.0:
* Breaking changes:
  * `AbstractStore` renamed to `Middleware`, and now it implements `MiddlewareAPI` instead of `Store`;

### 1.6.0:
* update types to support redux 4.2.0;

### 1.5.4

* fix `WatchedController` type -> fix function parameter inferring;

### 1.5.3

* fix `WatchedController` type -> return type is action;

### 1.5.2

* fix import;

### 1.5.1

* add `WatchedController` type;

### 1.5.0

* add `watch` decorators for controller watching;

### 1.4.1

* fix type for watcher();

### 1.4.0

* add integration with cheap-di;
