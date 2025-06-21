`[ "header", "paragraph", "image", "list", "embed" ]`

```json
[
  {
    "type": "header",
    "data": {
      "text": "Why Telegram is the best messenger",
      "level": 2
    }
  }
]
```

```json
{
    "type" : "paragraph",
    "data" : {
        "text" : "Check out our projects on a <a href=\"https://github.com/codex-team\">GitHub page</a>.",
    }
}
```

```json
{
    "type" : "image",
    "data" : {
        "file": {
            "url" : "https://www.tesla.com/tesla_theme/assets/img/_vehicle_redesign/roadster_and_semi/roadster/hero.jpg"
        },
        "caption" : "Roadster // tesla.com",
        "withBorder" : false,
        "withBackground" : false,
        "stretched" : true,
    }
}
```

```json
{
  "type" : "list",
  "data" : {
    "style": "unordered",
    "items": [
      {
        "content": "Apples",
        "meta": {},
        "items": [
          {
            "content": "Red",
            "meta": {},
            "items": []
          },
        ]
      },
    ]
  }
}
```

```json
{
  "type" : "list",
  "data" : {
    "style": "ordered",
    "meta": {
      "start": 2,
      "counterType": "upper-roman",
    },
    "items" : [
      {
        "content": "Apples",
        "meta": {},
        "items": [
          {
            "content": "Red",
            "meta": {},
            "items": []
          },
        ]
      },
    ]
  }
}
```

```json
{
  "type" : "embed",
  "data" : {
    "service" : "coub",
    "source" : "https://coub.com/view/1czcdf",
    "embed" : "https://coub.com/embed/1czcdf",
    "width" : 580,
    "height" : 320,
    "caption" : "My Life"
  }
}

```ts
type UnknownObject = {
    [x: string]: unknown;
}

type TElement = {
    children: Descendant[];
    type: string;
} & UnknownObject

type TText = {
    text: string;
} & UnknownObject

type Descendant = TElement | TText
```