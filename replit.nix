{ pkgs }: {
  deps = [
    pkgs.nodejs_22
    pkgs.postgresql
    pkgs.nodePackages.npm
  ];
}
