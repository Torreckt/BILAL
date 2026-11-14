self.__MIDDLEWARE_MATCHERS = [
  {
    "regexp": "^\\/BILAL\\/preview(?:\\/(_next\\/data\\/[^/]{1,}))?(?:\\/((?!api|_next\\/static|_next\\/image|media|work\\/|brand\\/|.*\\.(?:png|jpg|svg|ico|mp4|webp|txt|xml)$).*))(\\.json|\\.rsc|\\.segments\\/.+\\.segment\\.rsc)?[\\/#\\?]?$",
    "originalSource": "/((?!api|_next/static|_next/image|media|work/|brand/|.*\\.(?:png|jpg|svg|ico|mp4|webp|txt|xml)$).*)"
  }
];self.__MIDDLEWARE_MATCHERS_CB && self.__MIDDLEWARE_MATCHERS_CB()