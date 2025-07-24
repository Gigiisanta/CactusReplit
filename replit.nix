{ pkgs }: {
  deps = [
    pkgs.nodejs-20_x
    pkgs.python312
    pkgs.python312Packages.pip
    pkgs.postgresql
    pkgs.redis
    pkgs.git
    pkgs.bash
  ];
} 