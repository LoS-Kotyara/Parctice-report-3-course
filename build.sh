#!/bin/bash

open="false"

while [ -n "$1" ]; do
  case "$1" in
  -o)
    open="true"
    ;;
  --open)
    open="true"
    ;;
  -f)
    if [[ -z $2 ]]; then
      echo -e "\e[91mSpecify file_name"
      echo -e '\e[39mexiting program'
      exit
    fi
    file_name="${2%%.*}"
    extension="${2#*.}"
    if [[ $extension == $file_name ]]; then
      extension="tex"
    fi

    shift
    ;;
  --)
    shift
    break
    ;;
  *)
    echo -e "\e[91m\e[103m$1\e[49m is not an option"
    echo -e "\e[39mparams:"
    echo "-o --open - open in new window"
    echo "-f [file_name] - exec for [file_name]"
    echo -e '\e[39mexiting program'
    exit
    ;;
  esac
  shift
done

if [[ -z $file_name ]]; then
  file_name="index"
  extension="tex"
fi

echo "filename: $file_name.$extension"

if [[ $extension != "tex" ]]; then
  echo -e "\e[91mfile extension should be \e[103m.tex\e[49m"
  echo -e '\e[39mexiting program'
  exit
fi

if [[ ! -f $file_name.tex ]]; then
  echo -e "\e[91m\e[103m$file_name.tex\e[49m does not exist"
  echo -e "\e[39mtype an existing file name"
  echo 'exiting program'
  exit
else
  echo "$file_name.$extension exists"
fi

mkdir -p tempFiles

mv $file_name.pdf $file_name.pdf1

echo -e "Generating a document with question marks in place of unknown references\n" > log
pdflatex -synctex=1 -interaction=nonstopmode --shell-escape -output-directory=tempFiles $file_name.tex >> log

echo -e "\nParsing all the .bib files that were included in the article and generating metainformation regarding references\n" >>log
bibtex tempFiles/$file_name >> log

echo -e "\nGenerating document with all the references in the correct places\n" >> log
pdflatex -synctex=1 -interaction=nonstopmode --shell-escape -output-directory=tempFiles $file_name.tex >>log

echo -e "\nIf adding references broke page numbering somewhere\n" >>log
pdflatex -synctex=1 -interaction=nonstopmode --shell-escape -output-directory=tempFiles $file_name.tex >>log

if [[ ! -f ./tempFiles/$file_name.pdf ]]; then
  echo -e "\e[91mThere are several errors"
  echo -e "\e[39mCheck the \e[91m\e[103m'log'\e[49m file"
else
  echo
  echo "There are no errors"
  mv tempFiles/$file_name.pdf $file_name.pdf
fi

if $open; then
  xdg-open $file_name.pdf &>/dev/null &
fi
