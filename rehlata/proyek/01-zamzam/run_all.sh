cd /home/user/superpowers/rehlata/proyek/01-zamzam
for i in 0 2 1 3 4 5 6 7 8 9 10 12 13; do
  echo "== scene $i start $(date +%T)"
  /opt/bvenv/bin/python blend3d.py $i frames frames/s$(printf %02d $i) > frames/log$i.txt 2>&1
  echo "== scene $i done $(date +%T) frames=$(ls frames/s$(printf %02d $i)/*.jpg | wc -l) err=$(grep -c Traceback frames/log$i.txt)"
done
echo ALLDONE
