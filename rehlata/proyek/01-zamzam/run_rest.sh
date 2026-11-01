cd /home/user/superpowers/rehlata/proyek/01-zamzam
for i in 5 6 7 8 9 10 12 13; do
  echo "== scene $i start $(date +%T)"
  /opt/bvenv/bin/python blend3d.py $i frames frames/s$(printf %02d $i) > frames/log$i.txt 2>&1
  echo "== scene $i done $(date +%T) frames=$(ls frames/s$(printf %02d $i)/*.jpg | wc -l)"
done
if [ ! -f frames/s02b/done ]; then
  echo "== scene 2b start $(date +%T)"
  /opt/bvenv/bin/python blend3d.py 2 frames frames/s02b > frames/log2b.txt 2>&1 && touch frames/s02b/done
  echo "== scene 2b done $(date +%T) frames=$(ls frames/s02b/*.jpg | wc -l)"
fi
echo ALLDONE
